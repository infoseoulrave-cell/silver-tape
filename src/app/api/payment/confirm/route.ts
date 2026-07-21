import { NextRequest, NextResponse } from 'next/server';
import { getOrder, updateOrder } from '@/lib/order-storage';
import { getTossAuthHeader, TOSS_CONFIRM_URL, isTossConfigured } from '@/lib/toss-server';
import { sendPurchaseEvent } from '@/lib/meta-conversions';
import { sendAlimtalk } from '@/lib/kakao-alimtalk';
import { createOrderAccessToken } from '@/lib/order-access';
import { notifyAdminOrderEvent } from '@/lib/admin-alerts';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  RequestValidationError,
  extractClientIp,
  isPaymentEnabled,
  validateAmount,
  validateOrderId,
  validatePaymentKey,
} from '@/lib/order-validation';
import type { Order, TossPaymentResponse } from '@/types/order';

interface ConfirmPayload {
  paymentKey: unknown;
  orderId: unknown;
  amount: unknown;
}

function isSimulationAllowed(): boolean {
  return process.env.ALLOW_SIMULATED_PAYMENT === 'true' && process.env.NODE_ENV !== 'production';
}

function buildOrderSummary(order: Order) {
  return {
    orderId: order.orderId,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod ?? null,
    status: order.status,
    shipping: {
      name: order.shipping.name,
      address: order.shipping.address,
      addressDetail: order.shipping.addressDetail,
    },
  };
}

async function parseTossError(response: Response): Promise<{ message?: string; code?: string }> {
  try {
    const body = (await response.json()) as { message?: string; code?: string };
    return body ?? {};
  } catch {
    return {};
  }
}

/**
 * POST /api/payment/confirm - payment confirmation.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isPaymentEnabled()) {
      return NextResponse.json(
        { error: 'Payment is currently under maintenance.' },
        { status: 503 },
      );
    }

    const clientIp = extractClientIp(request.headers.get('x-forwarded-for')) ?? 'unknown';
    const rate = checkRateLimit(`payment:confirm:${clientIp}`, 25, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSeconds) },
        },
      );
    }

    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      throw new RequestValidationError('Request body must be an object.');
    }

    const payload = body as ConfirmPayload;
    const paymentKey = validatePaymentKey(payload.paymentKey);
    const orderId = validateOrderId(payload.orderId);
    const amount = validateAmount(payload.amount);

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found.' },
        { status: 404 },
      );
    }

    if (order.totalAmount !== amount) {
      return NextResponse.json(
        { error: 'Amount does not match order total.' },
        { status: 400 },
      );
    }

    if (order.status === 'paid') {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        order: buildOrderSummary(order),
        orderAccessToken: createOrderAccessToken(order.orderId, order.shipping.phone),
      });
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Order cannot be confirmed in its current state.' },
        { status: 409 },
      );
    }

    if (isTossConfigured()) {
      const tossResponse = await fetch(TOSS_CONFIRM_URL, {
        method: 'POST',
        headers: {
          Authorization: getTossAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });

      if (!tossResponse.ok) {
        const errorData = await parseTossError(tossResponse);
        return NextResponse.json(
          {
            error: errorData.message ?? 'Payment confirmation failed.',
            code: errorData.code,
          },
          { status: tossResponse.status },
        );
      }

      const paymentData: TossPaymentResponse = await tossResponse.json();

      if (paymentData.orderId !== orderId) {
        return NextResponse.json(
          { error: 'Payment order mismatch.' },
          { status: 400 },
        );
      }

      if (paymentData.totalAmount !== order.totalAmount) {
        return NextResponse.json(
          { error: 'Payment amount mismatch.' },
          { status: 400 },
        );
      }

      const updated = await updateOrder(orderId, {
        status: 'paid',
        paymentKey: paymentData.paymentKey,
        paymentMethod: paymentData.method,
        paidAt: paymentData.approvedAt,
      }, 'pending');

      if (!updated) {
        return NextResponse.json({
          success: true,
          alreadyPaid: true,
          order: buildOrderSummary(order),
          orderAccessToken: createOrderAccessToken(order.orderId, order.shipping.phone),
        });
      }

      const paidOrder: Order = {
        ...order,
        status: 'paid',
        paymentKey: paymentData.paymentKey,
        paymentMethod: paymentData.method,
        paidAt: paymentData.approvedAt,
      };

      sendAlimtalk('order_complete', {
        orderId,
        name: order.shipping.name,
        phone: order.shipping.phone,
        totalAmount: paymentData.totalAmount,
      }).catch(err => console.error('[payment/confirm] AlimTalk failed:', err));

      notifyAdminOrderEvent({
        kind: 'payment_confirmed',
        orderRef: orderId,
        amount: paymentData.totalAmount,
        customerName: order.shipping.name,
        customerPhone: order.shipping.phone,
        status: 'paid',
      }).catch(err => console.error('[payment/confirm] Admin alert failed:', err));

      sendPurchaseEvent(
        {
          orderId,
          totalAmount: paymentData.totalAmount,
          items: order.items.map(item => ({
            id: item.productId,
            title: item.productTitle,
            price: (item.printPrice + item.framePrice) * item.quantity,
            quantity: item.quantity,
          })),
        },
        {
          name: order.shipping.name,
          phone: order.shipping.phone,
          clientIpAddress: clientIp,
          clientUserAgent: request.headers.get('user-agent') ?? undefined,
        },
      ).catch(err => console.error('[payment/confirm] Meta CAPI failed:', err));

      return NextResponse.json({
        success: true,
        order: buildOrderSummary(paidOrder),
        orderAccessToken: createOrderAccessToken(order.orderId, order.shipping.phone),
      });
    }

    if (!isSimulationAllowed()) {
      return NextResponse.json(
        {
          error:
            'Toss payment is not configured on the server. Set ALLOW_SIMULATED_PAYMENT=true in non-production for local testing.',
        },
        { status: 503 },
      );
    }

    const simUpdated = await updateOrder(orderId, {
      status: 'paid',
      paymentKey,
      paymentMethod: 'SIMULATION',
      paidAt: new Date().toISOString(),
    }, 'pending');

    if (!simUpdated) {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        order: buildOrderSummary(order),
        orderAccessToken: createOrderAccessToken(order.orderId, order.shipping.phone),
      });
    }

    const simulatedOrder: Order = {
      ...order,
      status: 'paid',
      paymentKey,
      paymentMethod: 'SIMULATION',
      paidAt: new Date().toISOString(),
    };

    notifyAdminOrderEvent({
      kind: 'payment_confirmed',
      orderRef: orderId,
      amount: order.totalAmount,
      customerName: order.shipping.name,
      customerPhone: order.shipping.phone,
      status: 'paid',
    }).catch(err => console.error('[payment/confirm] Admin alert failed:', err));

    return NextResponse.json({
      success: true,
      simulation: true,
      order: buildOrderSummary(simulatedOrder),
      orderAccessToken: createOrderAccessToken(order.orderId, order.shipping.phone),
    });
  } catch (err) {
    if (err instanceof RequestValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    console.error('[payment/confirm] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error while confirming payment.' },
      { status: 500 },
    );
  }
}

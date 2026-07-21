import { NextRequest, NextResponse } from 'next/server';
import { saveOrder } from '@/lib/order-storage';
import { sendInitiateCheckoutEvent } from '@/lib/meta-conversions';
import { createOrderAccessToken } from '@/lib/order-access';
import { notifyAdminOrderEvent } from '@/lib/admin-alerts';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  RequestValidationError,
  buildTrustedCartItems,
  calculateOrderTotals,
  extractClientIp,
  isPaymentEnabled,
  validateShippingInfo,
} from '@/lib/order-validation';
import type { Order } from '@/types/order';

/**
 * POST /api/orders - create order before payment.
 * Price/amount is always computed from trusted server-side catalog data.
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
    const rate = checkRateLimit(`orders:create:${clientIp}`, 20, 60_000);
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

    const payload = body as Record<string, unknown>;
    const trustedItems = buildTrustedCartItems(payload.items);
    const shipping = validateShippingInfo(payload.shipping);
    const totals = calculateOrderTotals(trustedItems);

    // If client sent totalAmount, verify for tamper detection.
    if (payload.totalAmount !== undefined) {
      const requestedTotal = Number(payload.totalAmount);
      if (!Number.isFinite(requestedTotal) || requestedTotal !== totals.totalAmount) {
        throw new RequestValidationError('Total amount mismatch.');
      }
    }

    const orderId = `HO-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const order: Order = {
      id: orderId,
      orderId,
      items: trustedItems,
      shipping,
      subtotal: totals.subtotal,
      shippingFee: totals.shippingFee,
      totalAmount: totals.totalAmount,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await saveOrder(order);

    notifyAdminOrderEvent({
      kind: 'order_created',
      orderRef: order.orderId,
      amount: order.totalAmount,
      customerName: shipping.name,
      customerPhone: shipping.phone,
      status: order.status,
    }).catch(err => console.error('[orders] Admin alert failed:', err));

    sendInitiateCheckoutEvent(
      totals.totalAmount,
      trustedItems.reduce((sum, item) => sum + item.quantity, 0),
      {
        name: shipping.name,
        phone: shipping.phone,
        clientIpAddress: clientIp,
        clientUserAgent: request.headers.get('user-agent') ?? undefined,
      },
    ).catch(() => {});

    const orderAccessToken = createOrderAccessToken(orderId, shipping.phone);

    return NextResponse.json({
      orderId: order.orderId,
      totalAmount: order.totalAmount,
      orderAccessToken,
    });
  } catch (err) {
    if (err instanceof RequestValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    console.error('[orders] Order creation failed:', err);
    return NextResponse.json(
      { error: 'Failed to create order.' },
      { status: 500 },
    );
  }
}

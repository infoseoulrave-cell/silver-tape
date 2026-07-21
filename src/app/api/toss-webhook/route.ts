import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getOrder, updateOrder } from '@/lib/order-storage';
import { getTossPayment, isTossConfigured } from '@/lib/toss-server';
import { sendAlimtalk } from '@/lib/kakao-alimtalk';
import { notifyAdminOrderEvent } from '@/lib/admin-alerts';
import { checkRateLimit } from '@/lib/rate-limit';
import { extractClientIp } from '@/lib/order-validation';

const TOSS_WEBHOOK_SECRET = process.env.TOSS_WEBHOOK_SECRET ?? '';

interface TossWebhookBody {
  eventType?: unknown;
  data?: {
    paymentKey?: unknown;
    orderId?: unknown;
    status?: unknown;
  };
}

function parseWebhookBody(raw: unknown): { eventType: string; paymentKey: string; orderId: string } | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const body = raw as TossWebhookBody;

  if (typeof body.eventType !== 'string') return null;
  if (typeof body.data?.paymentKey !== 'string') return null;
  if (typeof body.data?.orderId !== 'string') return null;

  return {
    eventType: body.eventType,
    paymentKey: body.data.paymentKey,
    orderId: body.data.orderId,
  };
}

function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!TOSS_WEBHOOK_SECRET || !signature) return false;
  const expected = createHmac('sha256', TOSS_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('base64');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return timingSafeEqual(sigBuf, expBuf);
}

/**
 * POST /api/toss-webhook - Toss webhook receiver.
 * Always returns 200 to avoid retry storms; validation is handled internally.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = extractClientIp(request.headers.get('x-forwarded-for')) ?? 'unknown';
    const rate = checkRateLimit(`toss:webhook:${clientIp}`, 180, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    const rawBodyText = await request.text();

    // Verify webhook signature before processing
    if (TOSS_WEBHOOK_SECRET) {
      const signature = request.headers.get('Toss-Signature');
      if (!verifyWebhookSignature(rawBodyText, signature)) {
        console.warn('[toss-webhook] Invalid webhook signature. Rejecting.');
        return NextResponse.json({ message: 'OK' }, { status: 200 });
      }
    }

    let rawBody: unknown;
    try {
      rawBody = JSON.parse(rawBodyText);
    } catch {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    const body = parseWebhookBody(rawBody);
    if (!body) {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    const supportedEvent =
      body.eventType === 'PAYMENT_STATUS_CHANGED' || body.eventType === 'DEPOSIT_CALLBACK';
    if (!supportedEvent) {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    const order = await getOrder(body.orderId);
    if (!order) {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    if (order.status === 'paid' || order.status === 'cancelled') {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    if (!isTossConfigured()) {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    const payment = await getTossPayment(body.paymentKey);
    if (!payment) {
      console.error('[toss-webhook] Failed to verify payment.');
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    // Cross-check payment/order mapping to block spoofed payloads.
    if (payment.orderId !== body.orderId) {
      console.warn('[toss-webhook] Payment order mismatch.');
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    if (order.paymentKey && order.paymentKey !== payment.paymentKey) {
      console.warn('[toss-webhook] Payment key mismatch for existing order.');
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    if (payment.status === 'DONE' && order.status === 'pending') {
      if (payment.totalAmount !== order.totalAmount) {
        console.error('[toss-webhook] Amount mismatch.');
        return NextResponse.json({ message: 'OK' }, { status: 200 });
      }

      const updated = await updateOrder(body.orderId, {
        status: 'paid',
        paymentKey: payment.paymentKey,
        paymentMethod: payment.method,
        paidAt: payment.approvedAt,
      }, 'pending');

      if (updated) {
        sendAlimtalk('order_complete', {
          orderId: body.orderId,
          name: order.shipping.name,
          phone: order.shipping.phone,
          totalAmount: order.totalAmount,
        }).catch(err => console.error('[toss-webhook] AlimTalk failed:', err));

        notifyAdminOrderEvent({
          kind: 'payment_confirmed',
          orderRef: body.orderId,
          amount: order.totalAmount,
          customerName: order.shipping.name,
          customerPhone: order.shipping.phone,
          status: 'paid',
        }).catch(err => console.error('[toss-webhook] Admin alert failed:', err));
      }
    }

    if (payment.status === 'CANCELED') {
      const cancelled = await updateOrder(body.orderId, { status: 'cancelled' }, 'pending');
      if (cancelled) {
        notifyAdminOrderEvent({
          kind: 'order_cancelled',
          orderRef: body.orderId,
          amount: order.totalAmount,
          customerName: order.shipping.name,
          customerPhone: order.shipping.phone,
          status: 'cancelled',
        }).catch(err => console.error('[toss-webhook] Admin alert failed:', err));
      }
    }

    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (err) {
    console.error('[toss-webhook] Error:', err);
    return NextResponse.json({ message: 'OK' }, { status: 200 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/order-storage';
import { verifyOrderAccessToken } from '@/lib/order-access';
import { checkRateLimit } from '@/lib/rate-limit';
import { extractClientIp } from '@/lib/order-validation';

/**
 * GET /api/orders/[orderId] - order lookup.
 * Requires a valid order access token to prevent IDOR.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const clientIp = extractClientIp(request.headers.get('x-forwarded-for')) ?? 'unknown';
  const rate = checkRateLimit(`orders:get:${clientIp}`, 60, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      },
    );
  }

  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order) {
    return NextResponse.json(
      { error: 'Order not found.' },
      { status: 404 },
    );
  }

  const providedToken =
    request.headers.get('x-order-token') ??
    request.nextUrl.searchParams.get('token');

  const tokenValid = verifyOrderAccessToken(providedToken, orderId, order.shipping.phone);
  if (!tokenValid) {
    // Return 404 to avoid leaking whether an orderId exists.
    return NextResponse.json(
      { error: 'Order not found.' },
      { status: 404 },
    );
  }

  const { paymentKey, ...safeOrder } = order;
  return NextResponse.json(safeOrder);
}


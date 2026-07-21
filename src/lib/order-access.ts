import { createHmac, timingSafeEqual } from 'crypto';
import { normalizePhoneNumber } from './order-validation';

const ORDER_ACCESS_SECRET = process.env.ORDER_ACCESS_TOKEN_SECRET ?? '';
if (!ORDER_ACCESS_SECRET) {
  console.error('[order-access] ORDER_ACCESS_TOKEN_SECRET is not set. Order access tokens will be disabled.');
}

function getOrderAccessSecret(): string {
  return ORDER_ACCESS_SECRET;
}

function signOrderAccess(orderId: string, normalizedPhone: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`${orderId}:${normalizedPhone}`)
    .digest('base64url');
}

export function createOrderAccessToken(orderId: string, phone: string): string | null {
  const secret = getOrderAccessSecret();
  if (!secret) return null;

  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) return null;

  return signOrderAccess(orderId, normalizedPhone, secret);
}

export function verifyOrderAccessToken(
  token: string | null | undefined,
  orderId: string,
  phone: string,
): boolean {
  if (!token) return false;
  const expected = createOrderAccessToken(orderId, phone);
  if (!expected) return false;

  const providedBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;

  return timingSafeEqual(providedBuf, expectedBuf);
}


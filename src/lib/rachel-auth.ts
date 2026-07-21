import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const RACHEL_SESSION_COOKIE = 'mr_rachel_session';

function getRachelPin(): string {
  const direct = (process.env.RACHEL_DASHBOARD_PIN ?? '').trim();
  if (direct) return direct;
  return (process.env.VENDOR_DASHBOARD_PIN ?? '').trim();
}

function getSessionSecret(): string {
  const direct = (process.env.RACHEL_SESSION_SECRET ?? '').trim();
  if (direct) return direct;
  return (process.env.ADMIN_SESSION_SECRET ?? '').trim();
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function secureEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function isRachelAuthConfigured(): boolean {
  return /^\d{4}$/.test(getRachelPin()) && getSessionSecret().length > 0;
}

export function validateRachelPin(input: string): boolean {
  const pin = getRachelPin();
  const normalized = input.trim();
  if (!/^\d{4}$/.test(pin)) return false;
  if (!/^\d{4}$/.test(normalized)) return false;
  return secureEqual(pin, normalized);
}

export function createRachelSessionToken(ttlSeconds = 60 * 60 * 24 * 14): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `rachel:${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyRachelSessionToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const secret = getSessionSecret();
  if (!secret) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  if (!secureEqual(sign(payload, secret), signature)) return false;

  const [role, expiresRaw] = payload.split(':');
  if (role !== 'rachel' || !expiresRaw || !/^\d+$/.test(expiresRaw)) return false;
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt)) return false;
  return expiresAt > Math.floor(Date.now() / 1000);
}

export async function isRachelAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyRachelSessionToken(cookieStore.get(RACHEL_SESSION_COOKIE)?.value);
}

import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'st_admin_session';
export type StaffRole = 'admin' | 'vendor';

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

function getAdminPassword(): string {
  return (process.env.ADMIN_DASHBOARD_PASSWORD ?? '').trim();
}

function getVendorPassword(): string {
  const pin = (process.env.VENDOR_DASHBOARD_PIN ?? '').trim();
  if (pin) return pin;
  return (process.env.VENDOR_DASHBOARD_PASSWORD ?? '').trim();
}

function getAdminSessionSecret(): string {
  const direct = (process.env.ADMIN_SESSION_SECRET ?? '').trim();
  if (direct.length > 0) return direct;
  return (process.env.ORDER_ACCESS_TOKEN_SECRET ?? '').trim();
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

export function isAdminAuthConfigured(): boolean {
  return getAdminPassword().length > 0 && getAdminSessionSecret().length > 0;
}

export function isVendorAuthConfigured(): boolean {
  const pin = getVendorPassword();
  return /^\d{4}$/.test(pin) && getAdminSessionSecret().length > 0;
}

export function validateAdminPassword(input: string): boolean {
  const password = getAdminPassword();
  if (!password) return false;
  return secureEqual(password, input);
}

export function validateVendorPassword(input: string): boolean {
  const pin = getVendorPassword();
  const normalizedInput = input.trim();
  if (!/^\d{4}$/.test(pin)) return false;
  if (!/^\d{4}$/.test(normalizedInput)) return false;
  return secureEqual(pin, normalizedInput);
}

export function validateStaffPassword(role: StaffRole, input: string): boolean {
  if (role === 'vendor') return validateVendorPassword(input);
  return validateAdminPassword(input);
}

function createSessionPayload(role: StaffRole, expiresAt: number): string {
  return `${role}:${expiresAt}`;
}

export function createStaffSessionToken(
  role: StaffRole,
  ttlSeconds = DEFAULT_SESSION_TTL_SECONDS,
): string | null {
  const secret = getAdminSessionSecret();
  if (!secret) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = createSessionPayload(role, expiresAt);
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

export function createAdminSessionToken(ttlSeconds = DEFAULT_SESSION_TTL_SECONDS): string | null {
  return createStaffSessionToken('admin', ttlSeconds);
}

function parseLegacyPayload(payload: string): { role: StaffRole; expiresAt: number } | null {
  if (!/^\d+$/.test(payload)) return null;
  return {
    role: 'admin',
    expiresAt: Number(payload),
  };
}

function parseRolePayload(payload: string): { role: StaffRole; expiresAt: number } | null {
  const [roleRaw, expiresRaw] = payload.split(':');
  if ((roleRaw !== 'admin' && roleRaw !== 'vendor') || !expiresRaw || !/^\d+$/.test(expiresRaw)) {
    return null;
  }
  return {
    role: roleRaw,
    expiresAt: Number(expiresRaw),
  };
}

export function verifyStaffSessionToken(token: string | null | undefined): StaffRole | null {
  if (!token) return null;
  const secret = getAdminSessionSecret();
  if (!secret) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload, secret);
  if (!secureEqual(expected, signature)) return null;

  const parsed = parseRolePayload(payload) ?? parseLegacyPayload(payload);
  if (!parsed) return null;
  if (!Number.isFinite(parsed.expiresAt) || parsed.expiresAt <= 0) return null;
  if (parsed.expiresAt <= Math.floor(Date.now() / 1000)) return null;

  return parsed.role;
}

export function verifyAdminSessionToken(token: string | null | undefined): boolean {
  return verifyStaffSessionToken(token) === 'admin';
}

export function verifyVendorSessionToken(token: string | null | undefined): boolean {
  const role = verifyStaffSessionToken(token);
  return role === 'vendor' || role === 'admin';
}

export async function getAuthenticatedRole(): Promise<StaffRole | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyStaffSessionToken(token);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAuthenticatedRole()) === 'admin';
}

export async function isVendorAuthenticated(): Promise<boolean> {
  const role = await getAuthenticatedRole();
  return role === 'vendor' || role === 'admin';
}

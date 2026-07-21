import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { extractClientIp } from '@/lib/order-validation';
import { recordPageView } from '@/lib/admin-data';

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return (
    ua.includes('bot') ||
    ua.includes('spider') ||
    ua.includes('crawler') ||
    ua.includes('headless') ||
    ua.includes('lighthouse')
  );
}

function stableHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function parsePath(raw: unknown): string {
  if (typeof raw !== 'string') return '/';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return '/';
  return trimmed.slice(0, 400);
}

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') ?? '';
  if (!userAgent || isBot(userAgent)) {
    return NextResponse.json({ ok: true });
  }

  const xff = request.headers.get('x-forwarded-for');
  const cfIp = request.headers.get('cf-connecting-ip');
  const clientIp = extractClientIp(xff) ?? (cfIp ? cfIp.trim() : 'unknown');

  const rate = checkRateLimit(`pageview:${clientIp}`, 300, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ ok: true });
  }

  let body: { path?: unknown; referrer?: unknown } = {};
  try {
    body = (await request.json()) as { path?: unknown; referrer?: unknown };
  } catch {
    // no-op
  }

  const path = parsePath(body.path);
  const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 1000) : null;
  const salt = process.env.ORDER_ACCESS_TOKEN_SECRET ?? 'st-default-salt';
  const dayKey = new Date().toISOString().slice(0, 10);
  const visitorKey = stableHash(`${clientIp}|${userAgent}|${dayKey}|${salt}`).slice(0, 40);
  const ipHash = stableHash(`${clientIp}|${salt}`).slice(0, 40);

  await recordPageView({
    path,
    referrer,
    visitorKey,
    userAgent,
    ipHash,
  });

  return NextResponse.json({ ok: true });
}

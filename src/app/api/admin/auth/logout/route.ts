import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

function parseRedirectTo(value: string | null | undefined): string {
  if (!value) return '/admin/login';
  if (!value.startsWith('/')) return '/admin/login';
  return value;
}

function buildRedirect(request: NextRequest, redirectTo: string): NextResponse {
  const response = NextResponse.redirect(new URL(redirectTo, request.url), 303);
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';
  let redirectTo = '/admin/login';

  if (contentType.includes('application/json')) {
    const body = (await request.json()) as { redirectTo?: unknown };
    redirectTo = parseRedirectTo(typeof body.redirectTo === 'string' ? body.redirectTo : null);
  } else {
    const formData = await request.formData();
    redirectTo = parseRedirectTo(typeof formData.get('redirectTo') === 'string' ? String(formData.get('redirectTo')) : null);
  }

  return buildRedirect(request, redirectTo);
}

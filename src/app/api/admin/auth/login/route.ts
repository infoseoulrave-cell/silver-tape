import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  type StaffRole,
  createStaffSessionToken,
  isAdminAuthConfigured,
  isVendorAuthConfigured,
  validateStaffPassword,
} from '@/lib/admin-auth';

function getDefaultRedirect(role: StaffRole): string {
  return role === 'vendor' ? '/rachel' : '/admin';
}

function getTargetUrl(request: NextRequest, role: StaffRole, redirectTo?: string): URL {
  if (redirectTo && redirectTo.startsWith('/')) {
    return new URL(redirectTo, request.url);
  }
  return new URL(getDefaultRedirect(role), request.url);
}

function parseRole(input: unknown): StaffRole {
  return input === 'vendor' ? 'vendor' : 'admin';
}

async function parseInput(
  request: NextRequest,
): Promise<{ password: string; redirectTo: string; role: StaffRole }> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = (await request.json()) as { password?: unknown; redirectTo?: unknown; role?: unknown };
    return {
      password: typeof body.password === 'string' ? body.password : '',
      redirectTo: typeof body.redirectTo === 'string' ? body.redirectTo : getDefaultRedirect(parseRole(body.role)),
      role: parseRole(body.role),
    };
  }

  const formData = await request.formData();
  return {
    password: String(formData.get('password') ?? ''),
    redirectTo: String(formData.get('redirectTo') ?? getDefaultRedirect(parseRole(formData.get('role')))),
    role: parseRole(formData.get('role')),
  };
}

export async function POST(request: NextRequest) {
  const isJson = (request.headers.get('content-type') ?? '').includes('application/json');
  const { password, redirectTo, role } = await parseInput(request);

  const configured = role === 'vendor' ? isVendorAuthConfigured() : isAdminAuthConfigured();
  if (!configured) {
    if (isJson) {
      return NextResponse.json(
        { error: `${role} auth is not configured.` },
        { status: 503 },
      );
    }
    const failed = NextResponse.redirect(
      new URL(role === 'vendor' ? '/rachel/login?error=config' : '/admin/login?error=config', request.url),
      303,
    );
    return failed;
  }

  if (!validateStaffPassword(role, password)) {
    if (isJson) {
      return NextResponse.json(
        { error: 'Invalid password.' },
        { status: 401 },
      );
    }
    const failed = NextResponse.redirect(
      new URL(role === 'vendor' ? '/rachel/login?error=invalid' : '/admin/login?error=invalid', request.url),
      303,
    );
    return failed;
  }

  const sessionToken = createStaffSessionToken(role);
  if (!sessionToken) {
    if (isJson) {
      return NextResponse.json(
        { error: 'Failed to create session token.' },
        { status: 500 },
      );
    }
    const failed = NextResponse.redirect(
      new URL(role === 'vendor' ? '/rachel/login?error=session' : '/admin/login?error=session', request.url),
      303,
    );
    return failed;
  }

  const response = isJson
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(getTargetUrl(request, role, redirectTo), 303);

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}

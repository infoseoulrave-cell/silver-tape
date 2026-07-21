import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedRole } from '@/lib/admin-auth';
import { updateAdminOrderStatus } from '@/lib/admin-data';

const ADMIN_ALLOWED_STATUSES = new Set([
  'pending',
  'paid',
  'preparing',
  'shipping',
  'delivered',
  'cancelled',
  'refunded',
]);

const VENDOR_ALLOWED_STATUSES = new Set([
  'preparing',
  'shipping',
  'delivered',
]);

function getStatusFromRequest(
  formData: FormData | null,
  json: Record<string, unknown> | null,
): string {
  if (formData) {
    const status = formData.get('status');
    if (typeof status === 'string') return status;
  }
  if (json && typeof json.status === 'string') return json.status;
  return '';
}

function getReturnTo(
  formData: FormData | null,
  json: Record<string, unknown> | null,
  fallback: string,
): string {
  if (formData) {
    const value = formData.get('returnTo');
    if (typeof value === 'string' && value.startsWith('/')) return value;
  }
  if (json && typeof json.returnTo === 'string' && json.returnTo.startsWith('/')) {
    return json.returnTo;
  }
  return fallback;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderPk: string }> },
) {
  const role = await getAuthenticatedRole();
  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let formData: FormData | null = null;
  let json: Record<string, unknown> | null = null;

  if (contentType.includes('application/json')) {
    json = (await request.json()) as Record<string, unknown>;
  } else {
    formData = await request.formData();
  }

  const status = getStatusFromRequest(formData, json).trim().toLowerCase();
  if (!status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }

  const canUpdate =
    role === 'admin'
      ? ADMIN_ALLOWED_STATUSES.has(status)
      : VENDOR_ALLOWED_STATUSES.has(status);

  if (!canUpdate) {
    return NextResponse.json(
      { error: `Status "${status}" is not allowed for role ${role}.` },
      { status: 403 },
    );
  }

  const { orderPk } = await params;
  const fallbackPath = role === 'admin' ? '/admin' : '/rachel';
  const returnTo = getReturnTo(formData, json, fallbackPath);

  try {
    await updateAdminOrderStatus(orderPk, status);
  } catch (err) {
    console.error('[admin/orders/status] update failed:', err);
    if (contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Failed to update status.' }, { status: 500 });
    }
    return NextResponse.redirect(new URL(`${returnTo}?error=status_update`, request.url), 303);
  }

  if (contentType.includes('application/json')) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL(`${returnTo}?updated=1`, request.url), 303);
}

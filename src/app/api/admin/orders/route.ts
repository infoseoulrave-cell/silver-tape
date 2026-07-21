import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedRole } from '@/lib/admin-auth';
import { listAdminOrders } from '@/lib/admin-data';

export async function GET(request: NextRequest) {
  if (!(await getAuthenticatedRole())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limitRaw = request.nextUrl.searchParams.get('limit');
  const status = request.nextUrl.searchParams.get('status') ?? undefined;
  const limit = limitRaw ? Number(limitRaw) : undefined;

  try {
    const orders = await listAdminOrders({
      limit: Number.isFinite(limit) ? Number(limit) : undefined,
      status,
    });
    return NextResponse.json({ orders });
  } catch (err) {
    console.error('[admin/orders] GET failed:', err);
    return NextResponse.json(
      { error: 'Failed to load orders.' },
      { status: 500 },
    );
  }
}

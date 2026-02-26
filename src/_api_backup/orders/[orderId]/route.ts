import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/order-storage';

/**
 * GET /api/orders/[orderId] — 주문 조회
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order) {
    return NextResponse.json(
      { error: '주문을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  return NextResponse.json(order);
}

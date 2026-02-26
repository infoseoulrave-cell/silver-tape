import { NextRequest, NextResponse } from 'next/server';
import { saveOrder } from '@/lib/order-storage';
import { sendInitiateCheckoutEvent } from '@/lib/meta-conversions';
import type { Order, ShippingInfo } from '@/types/order';
import type { CartItem } from '@/types/cart';

/**
 * POST /api/orders — 주문 생성 (결제 전)
 *
 * 결제 요청 전에 주문을 서버에 저장하여
 * 금액 위변조를 방지합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shipping, subtotal, shippingFee, totalAmount } = body as {
      items: CartItem[];
      shipping: ShippingInfo;
      subtotal: number;
      shippingFee: number;
      totalAmount: number;
    };

    if (!items?.length || !shipping?.name || !totalAmount) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 서버에서 금액 재계산하여 검증
    const calculatedSubtotal = items.reduce(
      (sum, item) => sum + (item.printPrice + item.framePrice) * item.quantity,
      0
    );
    const calculatedShipping = calculatedSubtotal >= 50000 ? 0 : 3500;
    const calculatedTotal = calculatedSubtotal + calculatedShipping;

    if (calculatedTotal !== totalAmount) {
      return NextResponse.json(
        { error: '금액이 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    const orderId = `HO-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const order: Order = {
      id: orderId,
      orderId,
      items,
      shipping,
      subtotal: calculatedSubtotal,
      shippingFee: calculatedShipping,
      totalAmount: calculatedTotal,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await saveOrder(order);

    // Meta Conversion API — InitiateCheckout 이벤트 (비차단)
    sendInitiateCheckoutEvent(
      calculatedTotal,
      items.reduce((sum, i) => sum + i.quantity, 0),
      {
        name: shipping.name,
        phone: shipping.phone,
        clientIpAddress: request.headers.get('x-forwarded-for') ?? undefined,
        clientUserAgent: request.headers.get('user-agent') ?? undefined,
      },
    ).catch(() => {});

    return NextResponse.json({
      orderId: order.orderId,
      totalAmount: order.totalAmount,
    });
  } catch (err) {
    console.error('Order creation failed:', err);
    return NextResponse.json(
      { error: '주문 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

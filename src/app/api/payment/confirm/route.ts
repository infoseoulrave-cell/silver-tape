import { NextRequest, NextResponse } from 'next/server';
import { getOrder, updateOrder } from '@/lib/order-storage';
import { getTossAuthHeader, TOSS_CONFIRM_URL, isTossConfigured } from '@/lib/toss-payments';
import { sendPurchaseEvent } from '@/lib/meta-conversions';
import type { TossPaymentResponse } from '@/types/order';

/**
 * POST /api/payment/confirm — 결제 승인
 *
 * 1. orderId로 서버 저장된 주문 조회
 * 2. 금액 일치 검증 (위변조 방지)
 * 3. TossPayments confirm API 호출
 * 4. 주문 상태 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: 'paymentKey, orderId, amount 모두 필요합니다.' },
        { status: 400 }
      );
    }

    // 1. 서버에 저장된 주문 조회
    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2. 이미 결제된 주문이면 idempotent 처리
    if (order.status === 'paid') {
      return NextResponse.json({
        success: true,
        orderId,
        amount: order.totalAmount,
        method: order.paymentMethod ?? 'PAID',
        alreadyPaid: true,
      });
    }

    // 3. 금액 위변조 검증
    if (order.totalAmount !== amount) {
      await updateOrder(orderId, { status: 'failed' });
      return NextResponse.json(
        { error: '결제 금액이 주문 금액과 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 4. TossPayments confirm API 호출
    if (isTossConfigured()) {
      const tossResponse = await fetch(TOSS_CONFIRM_URL, {
        method: 'POST',
        headers: {
          'Authorization': getTossAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });

      if (!tossResponse.ok) {
        const errorData = await tossResponse.json();
        await updateOrder(orderId, { status: 'failed' });
        return NextResponse.json(
          { error: errorData.message ?? '결제 승인에 실패했습니다.', code: errorData.code },
          { status: tossResponse.status }
        );
      }

      const paymentData: TossPaymentResponse = await tossResponse.json();

      // 5. 주문 상태 업데이트
      await updateOrder(orderId, {
        status: 'paid',
        paymentKey: paymentData.paymentKey,
        paymentMethod: paymentData.method,
        paidAt: paymentData.approvedAt,
      });

      // 6. Meta Conversion API — Purchase 이벤트 (비차단)
      sendPurchaseEvent(
        {
          orderId,
          totalAmount: paymentData.totalAmount,
          items: order.items.map(i => ({
            id: i.productId,
            title: i.productTitle,
            price: (i.printPrice + i.framePrice) * i.quantity,
            quantity: i.quantity,
          })),
        },
        {
          name: order.shipping.name,
          phone: order.shipping.phone,
          clientIpAddress: request.headers.get('x-forwarded-for') ?? undefined,
          clientUserAgent: request.headers.get('user-agent') ?? undefined,
        },
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        orderId,
        amount: paymentData.totalAmount,
        method: paymentData.method,
      });
    }

    // TossPayments 미설정 시 시뮬레이션 모드
    await updateOrder(orderId, {
      status: 'paid',
      paymentKey: paymentKey ?? `sim-${Date.now()}`,
      paymentMethod: '시뮬레이션',
      paidAt: new Date().toISOString(),
    });

    // Meta Conversion API — Purchase 이벤트 (시뮬레이션, 비차단)
    sendPurchaseEvent(
      {
        orderId,
        totalAmount: amount,
        items: order.items.map(i => ({
          id: i.productId,
          title: i.productTitle,
          price: (i.printPrice + i.framePrice) * i.quantity,
          quantity: i.quantity,
        })),
      },
      {
        name: order.shipping.name,
        phone: order.shipping.phone,
        clientIpAddress: request.headers.get('x-forwarded-for') ?? undefined,
        clientUserAgent: request.headers.get('user-agent') ?? undefined,
      },
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      orderId,
      amount,
      method: '시뮬레이션',
      simulation: true,
    });
  } catch (err) {
    console.error('Payment confirmation failed:', err);
    return NextResponse.json(
      { error: '결제 승인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

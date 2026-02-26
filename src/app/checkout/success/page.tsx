'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { formatKRW } from '@/lib/format';
import type { Order } from '@/types/order';
import styles from './success.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const clearCart = useCartStore(s => s.clearCart);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(true);

  useEffect(() => {
    async function confirmPayment() {
      if (!orderId || !amount) {
        setError('주문 정보가 누락되었습니다.');
        setConfirming(false);
        return;
      }

      try {
        // 서버에서 결제 승인 처리
        const res = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey: paymentKey ?? `sim-${Date.now()}`,
            orderId,
            amount: Number(amount),
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? '결제 승인에 실패했습니다.');
          setConfirming(false);
          return;
        }

        // 주문 정보 조회
        const orderRes = await fetch(`/api/orders/${orderId}`);
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrder(orderData);
        }

        clearCart();
      } catch {
        setError('결제 확인 중 오류가 발생했습니다.');
      } finally {
        setConfirming(false);
      }
    }

    confirmPayment();
  }, [paymentKey, orderId, amount, clearCart]);

  if (confirming) {
    return (
      <div className={styles.card}>
        <div className={styles.spinner} />
        <h1 className={styles.title}>결제 확인 중...</h1>
        <p className={styles.subtitle}>잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.card}>
        <div className={styles.iconFail}>&times;</div>
        <h1 className={styles.title}>결제 승인 실패</h1>
        <p className={styles.subtitle}>{error}</p>
        <p className={styles.note}>결제 금액은 청구되지 않았습니다.</p>
        <div className={styles.actions}>
          <Link href="/checkout" className={styles.primaryBtn}>다시 시도</Link>
          <Link href="/cart" className={styles.secondaryBtn}>장바구니로</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.icon}>&#10003;</div>
      <h1 className={styles.title}>주문 완료!</h1>
      <p className={styles.subtitle}>예술에 취할 준비가 완료되었습니다.</p>

      {order && (
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>주문번호</span>
            <span className={styles.detailValue}>{order.orderId}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>결제금액</span>
            <span className={styles.detailValue}>{formatKRW(order.totalAmount)}</span>
          </div>
          {order.paymentMethod && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>결제수단</span>
              <span className={styles.detailValue}>{order.paymentMethod}</span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>배송지</span>
            <span className={styles.detailValue}>
              {order.shipping.name} / {order.shipping.address} {order.shipping.addressDetail}
            </span>
          </div>
        </div>
      )}

      <p className={styles.note}>
        제작 시작 안내 이메일이 곧 발송됩니다.<br />
        영업일 기준 2-4일 이내 출고됩니다.
      </p>

      <div className={styles.actions}>
        <Link href="/products" className={styles.primaryBtn}>
          더 둘러보기
        </Link>
        <Link href="/" className={styles.secondaryBtn}>
          홈으로
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className={styles.container}>
      <Suspense fallback={<div className={styles.card}>로딩 중...</div>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}

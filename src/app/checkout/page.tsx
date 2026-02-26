'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';
import { useCartStore } from '@/lib/cart-store';
import { formatKRW } from '@/lib/format';
import { trackInitiateCheckout } from '@/lib/meta-pixel-events';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './checkout.module.css';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? '';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, getTotalPrice } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const widgetRef = useRef<TossPaymentsWidgets | null>(null);
  const paymentMethodsRendered = useRef(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    postalCode: '',
    address: '',
    addressDetail: '',
    memo: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // InitiateCheckout 이벤트 (체크아웃 진입 시 1회)
  const trackedRef = useRef(false);
  useEffect(() => {
    if (mounted && items.length > 0 && !trackedRef.current) {
      trackedRef.current = true;
      trackInitiateCheckout({
        numItems: items.reduce((sum, i) => sum + i.quantity, 0),
        value: getTotalPrice(),
      });
    }
  }, [mounted, items, getTotalPrice]);

  const totalPrice = mounted ? getTotalPrice() : 0;
  const shippingFee = totalPrice >= 50000 ? 0 : 3500;
  const grandTotal = totalPrice + shippingFee;

  // TossPayments 위젯 초기화
  const initWidget = useCallback(async () => {
    if (!TOSS_CLIENT_KEY || paymentMethodsRendered.current || grandTotal <= 0) return;

    try {
      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const widgets = tossPayments.widgets({ customerKey: 'ANONYMOUS' });

      await widgets.setAmount({ currency: 'KRW', value: grandTotal });

      await widgets.renderPaymentMethods({
        selector: '#toss-payment-methods',
        variantKey: 'DEFAULT',
      });

      await widgets.renderAgreement({
        selector: '#toss-agreement',
        variantKey: 'AGREEMENT',
      });

      widgetRef.current = widgets;
      paymentMethodsRendered.current = true;
    } catch (err) {
      console.error('TossPayments widget init failed:', err);
    }
  }, [grandTotal]);

  useEffect(() => {
    if (mounted && items.length > 0 && TOSS_CLIENT_KEY) {
      initWidget();
    }
  }, [mounted, items.length, initWidget]);

  // 금액 변경 시 위젯 업데이트
  useEffect(() => {
    if (widgetRef.current && grandTotal > 0) {
      widgetRef.current.setAmount({ currency: 'KRW', value: grandTotal });
    }
  }, [grandTotal]);

  if (!mounted) return null;

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // 1. 서버에 주문 생성 (금액 위변조 방지)
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          shipping: form,
          subtotal: totalPrice,
          shippingFee,
          totalAmount: grandTotal,
        }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.error ?? '주문 생성에 실패했습니다.');
      }

      const { orderId, totalAmount } = await orderRes.json();

      // 주문 이름 생성
      const orderName = items.length === 1
        ? items[0].productTitle
        : `${items[0].productTitle} 외 ${items.length - 1}건`;

      // 2. TossPayments 결제 요청
      if (widgetRef.current) {
        await widgetRef.current.requestPayment({
          orderId,
          orderName,
          successUrl: `${window.location.origin}/checkout/success`,
          failUrl: `${window.location.origin}/checkout/fail`,
          customerName: form.name,
          customerMobilePhone: form.phone.replace(/-/g, ''),
        });
      } else {
        // TossPayments 미설정 — 시뮬레이션 모드
        const confirmRes = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey: `sim-${Date.now()}`,
            orderId,
            amount: totalAmount,
          }),
        });

        if (!confirmRes.ok) {
          const data = await confirmRes.json();
          throw new Error(data.error ?? '결제 승인에 실패했습니다.');
        }

        router.push(`/checkout/success?orderId=${orderId}&amount=${totalAmount}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.';
      // USER_CANCEL은 사용자가 결제 취소한 것이므로 에러로 표시하지 않음
      if (!message.includes('USER_CANCEL')) {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = form.name && form.phone && form.postalCode && form.address;
  const isTossMode = !!TOSS_CLIENT_KEY;

  return (
    <main>
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '장바구니', href: '/cart' }, { label: '주문/결제' }]} />
      <div className={styles.container}>
        <h1 className={styles.title}>CHECKOUT</h1>

        <form className={styles.layout} onSubmit={handleSubmit}>
          {/* Shipping Form */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>배송 정보</h2>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">수령인</label>
              <input
                id="name"
                name="name"
                type="text"
                className={styles.input}
                value={form.name}
                onChange={handleChange}
                required
                placeholder="이름을 입력하세요"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="phone">연락처</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={styles.input}
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="010-0000-0000"
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field} style={{ flex: 1 }}>
                <label className={styles.label} htmlFor="postalCode">우편번호</label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  className={styles.input}
                  value={form.postalCode}
                  onChange={handleChange}
                  required
                  placeholder="12345"
                  maxLength={5}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="address">기본 주소</label>
              <input
                id="address"
                name="address"
                type="text"
                className={styles.input}
                value={form.address}
                onChange={handleChange}
                required
                placeholder="도로명 또는 지번 주소"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="addressDetail">상세 주소</label>
              <input
                id="addressDetail"
                name="addressDetail"
                type="text"
                className={styles.input}
                value={form.addressDetail}
                onChange={handleChange}
                placeholder="동/호수 등 상세 주소"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="memo">배송 메모</label>
              <textarea
                id="memo"
                name="memo"
                className={styles.textarea}
                value={form.memo}
                onChange={handleChange}
                placeholder="부재 시 문 앞에 놓아주세요"
                rows={3}
              />
            </div>

            {/* Payment Section */}
            <h2 className={styles.sectionTitle} style={{ marginTop: 'var(--ho-space-xl)' }}>결제 수단</h2>

            {isTossMode ? (
              <>
                <div id="toss-payment-methods" />
                <div id="toss-agreement" />
              </>
            ) : (
              <div className={styles.paymentPlaceholder}>
                <p>시뮬레이션 모드</p>
                <p className={styles.paymentNote}>
                  TossPayments 키가 설정되면 실제 결제 위젯이 표시됩니다.
                </p>
              </div>
            )}

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>ORDER SUMMARY</h2>

            <div className={styles.summaryItems}>
              {items.map(item => (
                <div key={item.id} className={styles.summaryItem}>
                  <Image
                    src={item.productImage}
                    alt={item.productTitle}
                    width={60}
                    height={75}
                    className={styles.summaryItemImg}
                  />
                  <div className={styles.summaryItemInfo}>
                    <div className={styles.summaryItemName}>{item.productTitle}</div>
                    <div className={styles.summaryItemMeta}>
                      {item.size} / {item.frame === 'none' ? '프린트' : item.frame}
                    </div>
                    <div className={styles.summaryItemPrice}>
                      {formatKRW((item.printPrice + item.framePrice) * item.quantity)} × {item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summaryRow}>
              <span>상품 금액</span>
              <span>{formatKRW(totalPrice)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>배송비</span>
              <span>{shippingFee === 0 ? '무료' : formatKRW(shippingFee)}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>결제 금액</span>
              <span>{formatKRW(grandTotal)}</span>
            </div>

            <button
              type="submit"
              className={styles.payBtn}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? '처리 중...' : `${formatKRW(grandTotal)} 결제하기`}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

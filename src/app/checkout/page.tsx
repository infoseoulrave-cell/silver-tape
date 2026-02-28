'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/lib/cart-store';
import { formatKRW } from '@/lib/format';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './checkout.module.css';

const NAVER_STORE_URL = 'https://smartstore.naver.com/1of23';

/* ── 결제 시스템 점검 중 — Toss 위젯 비활성화 ── */
const PAYMENT_MAINTENANCE = true;

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, getTotalPrice } = useCartStore();

  useEffect(() => { setMounted(true); }, []);

  const totalPrice = mounted ? getTotalPrice() : 0;
  const shippingFee = totalPrice >= 50000 ? 0 : 3500;
  const grandTotal = totalPrice + shippingFee;

  if (!mounted) return null;

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <main>
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '장바구니', href: '/cart' }, { label: '주문/결제' }]} />
      <div className={styles.container}>
        <h1 className={styles.title}>CHECKOUT</h1>

        <div className={styles.layout}>
          {/* 결제 점검 안내 */}
          <div className={styles.formSection}>
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px solid #e8e8e8',
              borderRadius: '12px',
              background: '#fafafa',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔧</div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: '0 0 12px',
                fontFamily: 'var(--font-space-grotesk), Pretendard, sans-serif',
              }}>
                결제 시스템 점검 중
              </h2>
              <p style={{
                fontSize: '15px',
                lineHeight: 1.8,
                color: '#555',
                margin: '0 0 8px',
                wordBreak: 'keep-all' as const,
              }}>
                현재 사이트 내 직접 결제가 일시적으로 불가합니다.
              </p>
              <p style={{
                fontSize: '15px',
                lineHeight: 1.8,
                color: '#555',
                margin: '0 0 28px',
                wordBreak: 'keep-all' as const,
              }}>
                구매를 원하시는 분은 <strong>네이버 스마트스토어</strong>를 이용해 주세요.
              </p>

              <a
                href={NAVER_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 32px',
                  background: '#03C75A',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontFamily: 'Pretendard, "Noto Sans KR", sans-serif',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M11.34 9.58L6.26 2.7H2.7v12.6h4.36V8.42l5.08 6.88h3.56V2.7h-4.36v6.88z" fill="white"/>
                </svg>
                네이버 스토어에서 구매하기
              </a>

              <p style={{
                fontSize: '13px',
                color: '#999',
                marginTop: '20px',
              }}>
                빠른 시일 내에 정상화하겠습니다. 감사합니다.
              </p>
            </div>
          </div>

          {/* Order Summary — 그대로 유지 */}
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

            <a
              href={NAVER_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.payBtn}
              style={{ textAlign: 'center', textDecoration: 'none', display: 'block', background: '#03C75A' }}
            >
              네이버 스토어에서 구매하기
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { formatKRW } from '@/lib/format';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './cart.module.css';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const totalPrice = getTotalPrice();
  const shippingFee = totalPrice >= 50000 ? 0 : 3500;
  const grandTotal = totalPrice + shippingFee;

  return (
    <main>
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '장바구니' }]} />
      <div className={styles.container}>
        <h1 className={styles.title}>YOUR TAB</h1>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>&#127867;</p>
            <h2 className={styles.emptyTitle}>아직 비어있어요</h2>
            <p className={styles.emptyDesc}>예술에 취할 준비가 되셨나요?</p>
            <Link href="/products" className={styles.emptyBtn}>
              작품 보러 가기
            </Link>
          </div>
        ) : (
          <div className={styles.layout}>
            {/* Items */}
            <div className={styles.itemsSection}>
              {items.map(item => {
                const itemTotal = (item.printPrice + item.framePrice) * item.quantity;
                return (
                  <div key={item.id} className={styles.item}>
                    <Image
                      src={item.productImage}
                      alt={item.productTitle}
                      width={120}
                      height={150}
                      className={styles.itemImg}
                    />
                    <div className={styles.itemInfo}>
                      <div className={styles.itemName}>{item.productTitle}</div>
                      <div className={styles.itemMeta}>
                        {item.size} / {item.frame === 'none' ? '프린트' : item.frame} / {item.artworkBg}
                      </div>
                      <div className={styles.itemActions}>
                        <div className={styles.itemQty}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= 10}>+</button>
                        </div>
                        <div className={styles.itemPrice}>{formatKRW(itemTotal)}</div>
                        <button className={styles.itemRemove} onClick={() => removeItem(item.id)}>삭제</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className={styles.summary}>
              <h2 className={styles.summaryTitle}>ORDER SUMMARY</h2>
              <div className={styles.summaryRow}>
                <span>상품 금액</span>
                <span>{formatKRW(totalPrice)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>배송비</span>
                <span>{shippingFee === 0 ? '무료' : formatKRW(shippingFee)}</span>
              </div>
              {shippingFee === 0 && (
                <div className={styles.freeShipping}>5만원 이상 무료배송 적용</div>
              )}
              <div className={styles.summaryTotal}>
                <span>합계</span>
                <span>{formatKRW(grandTotal)}</span>
              </div>
              <Link href="/checkout" className={styles.checkoutBtn}>
                주문하기 — CHECKOUT
              </Link>
              <Link href="/products" className={styles.continueLink}>
                쇼핑 계속하기
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

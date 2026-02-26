'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { formatKRW } from '@/lib/format';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQuantity, getTotalPrice, getTotalItems } =
    useCartStore();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) toggleCart();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, toggleCart]);

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
        onClick={toggleCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-label="장바구니"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Your Tab ({totalItems})</h2>
          <button className={styles.close} onClick={toggleCart} aria-label="닫기">
            &times;
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>&#127867;</div>
            <div className={styles.emptyTitle}>아직 비어있어요</div>
            <p className={styles.emptyDesc}>예술에 취할 준비가 되셨나요?</p>
          </div>
        ) : (
          <div className={styles.items}>
            {items.map(item => {
              const itemTotal = (item.printPrice + item.framePrice) * item.quantity;
              return (
                <div key={item.id} className={styles.item}>
                  <Image
                    src={item.productImage}
                    alt={item.productTitle}
                    width={80}
                    height={100}
                    className={styles.itemImg}
                  />
                  <div className={styles.itemInfo}>
                    <div>
                      {item.studioName && (
                        <div className={styles.itemStudio}>{item.studioName}</div>
                      )}
                      <div className={styles.itemName}>{item.productTitle}</div>
                      <div className={styles.itemMeta}>
                        {item.size} / {item.frame === 'none' ? '프린트' : item.frame} / {item.artworkBg}
                      </div>
                    </div>
                    <div className={styles.itemBottom}>
                      <div className={styles.itemQty}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="수량 감소"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                          aria-label="수량 증가"
                        >
                          +
                        </button>
                      </div>
                      <div className={styles.itemPrice}>{formatKRW(itemTotal)}</div>
                      <button
                        className={styles.itemRemove}
                        onClick={() => removeItem(item.id)}
                        aria-label="삭제"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalPrice}>{formatKRW(totalPrice)}</span>
            </div>
            <Link href="/checkout" className={styles.checkoutBtn} onClick={toggleCart}>
              주문하기 — CHECKOUT
            </Link>
            <button className={styles.continueBtn} onClick={toggleCart}>
              쇼핑 계속하기
            </button>
          </div>
        )}
      </div>
    </>
  );
}

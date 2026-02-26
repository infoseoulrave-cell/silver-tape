'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import styles from './CollectionFab.module.css';

export default function CollectionFab() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isOpen = useCartStore(s => s.isOpen);
  const getTotalItems = useCartStore(s => s.getTotalItems);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const totalItems = mounted ? getTotalItems() : 0;
  const visible = scrolled && !isOpen;

  return (
    <Link
      href="/cart"
      className={`${styles.fab} ${visible ? styles.visible : ''}`}
      aria-label={`내 컬렉션 — ${totalItems}개 작품`}
    >
      {/* Frame icon */}
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="6" y="6" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      </svg>
      <span className={styles.label}>Collection</span>
      {totalItems > 0 && (
        <span className={styles.count}>{totalItems}</span>
      )}
    </Link>
  );
}

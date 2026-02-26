'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import styles from './Header.module.css';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toggleCart = useCartStore(s => s.toggleCart);
  const getTotalItems = useCartStore(s => s.getTotalItems);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const totalItems = mounted ? getTotalItems() : 0;

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          HANG<span className={styles.logoAccent}>O</span>VER
        </Link>
        <nav className={styles.nav}>
          <Link href="/products" className={styles.navLink}>Fresh Pour</Link>
          <Link href="/products" className={styles.navLink}>Collections</Link>
          <Link href="/products" className={styles.navLink}>Most Wasted</Link>
          <Link href="/about" className={styles.navLink}>About</Link>
        </nav>
        <button className={styles.cartBtn} onClick={toggleCart} aria-label="장바구니 열기">
          Cart
          {totalItems > 0 && <span className={styles.cartCount}>{totalItems}</span>}
        </button>
      </div>
    </header>
  );
}

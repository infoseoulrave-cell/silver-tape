'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/cart-store';
import styles from './Header.module.css';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleCart = useCartStore(s => s.toggleCart);
  const getTotalItems = useCartStore(s => s.getTotalItems);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  const totalItems = mounted ? getTotalItems() : 0;

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo} onClick={closeMenu}>
            <Image
              src="/logo-header.webp"
              alt="SILVERTAPE"
              width={942}
              height={264}
              className={styles.logoImg}
              priority
            />
          </Link>
          <nav className={styles.nav}>
            <Link href="/shop" className={styles.navLink}>Shop</Link>
            <Link href="/studios" className={styles.navLink}>Studios</Link>
            <Link href="/about" className={styles.navLink}>About</Link>
          </nav>
          <div className={styles.actions}>
            <button className={styles.cartBtn} onClick={toggleCart} aria-label="내 컬렉션 열기">
              Collection
              {totalItems > 0 && <span className={styles.cartCount}>{totalItems}</span>}
            </button>
            <button
              className={`${styles.menuBtn} ${menuOpen ? styles.menuBtnOpen : ''}`}
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={menuOpen}
            >
              <span className={styles.menuIcon} />
            </button>
          </div>
        </div>
      </header>

      <nav
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}
        aria-label="모바일 내비게이션"
        aria-hidden={!menuOpen}
      >
        <Link href="/shop" className={styles.mobileLink} onClick={closeMenu}>Shop</Link>
        <Link href="/studios" className={styles.mobileLink} onClick={closeMenu}>Studios</Link>
        <Link href="/about" className={styles.mobileLink} onClick={closeMenu}>About</Link>
        <button
          className={styles.mobileLink}
          onClick={() => { closeMenu(); toggleCart(); }}
        >
          Collection{totalItems > 0 ? ` (${totalItems})` : ''}
        </button>
      </nav>
    </>
  );
}

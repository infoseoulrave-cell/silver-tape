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

  const totalItems = mounted ? getTotalItems() : 0;

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo} onClick={closeMenu}>
            <Image
              src="/logo-header.png"
              alt="SILVERTAPE"
              width={253}
              height={72}
              className={styles.logoImg}
              priority
            />
          </Link>
          <nav className={styles.nav}>
            <Link href="/#studios" className={styles.navLink}>Studios</Link>
            <Link href="/studio/hangover" className={styles.navLink}>HANGOVER</Link>
            <Link href="/studio/void" className={styles.navLink}>VOID.</Link>
            <Link href="/studio/sensibility" className={styles.navLink}>SENSIBILITY STAIR</Link>
            <Link href="/studio/phantom-reel" className={styles.navLink}>PHANTOM REEL</Link>
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
        <Link href="/#studios" className={styles.mobileLink} onClick={closeMenu}>Studios</Link>
        <Link href="/studio/hangover" className={styles.mobileLink} onClick={closeMenu}>HANGOVER</Link>
        <Link href="/studio/void" className={styles.mobileLink} onClick={closeMenu}>VOID.</Link>
        <Link href="/studio/sensibility" className={styles.mobileLink} onClick={closeMenu}>SENSIBILITY STAIR</Link>
        <Link href="/studio/phantom-reel" className={styles.mobileLink} onClick={closeMenu}>PHANTOM REEL</Link>
        <div className={styles.mobileDivider} />
        <Link href="/about" className={styles.mobileLinkSm} onClick={closeMenu}>플랫폼 소개</Link>
        <Link href="/faq" className={styles.mobileLinkSm} onClick={closeMenu}>자주 묻는 질문</Link>
      </nav>
    </>
  );
}

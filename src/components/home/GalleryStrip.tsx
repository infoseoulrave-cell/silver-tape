'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, useCallback } from 'react';
import styles from './GalleryStrip.module.css';

interface StripItem {
  image: string;
  title: string;
  sub: string;
  price: string;
  href: string;
}

const STRIP_ITEMS: StripItem[] = [
  { image: '/images/gallery-strip/strip-1.jpg', title: 'Echoes of Crimson', sub: 'HANGOVER', price: '\u20A945,000', href: '/studio/hangover/echoes-of-crimson' },
  { image: '/images/gallery-strip/strip-3.jpg', title: 'Glass Hammer', sub: 'SENSIBILITY STAIR', price: '\u20A948,000', href: '/studio/sensibility/glass-hammer' },
  { image: '/images/gallery-strip/strip-4.jpg', title: 'Goldfish Cosmonaut', sub: 'HANGOVER', price: '\u20A938,000', href: '/studio/hangover/goldfish-cosmonaut' },
  { image: '/images/gallery-strip/strip-5.jpg', title: 'Cactus Symphony', sub: 'HANGOVER', price: '\u20A955,000', href: '/studio/hangover/cactus-symphony' },
  { image: '/images/gallery-strip/strip-6.jpg', title: 'Red Turtleneck', sub: 'HANGOVER', price: '\u20A938,000', href: '/studio/hangover/red-turtleneck' },
  { image: '/images/gallery-strip/strip-7.jpg', title: 'Salt Walker', sub: 'HANGOVER', price: '\u20A942,000', href: '/studio/hangover/salt-walker' },
  { image: '/images/gallery-strip/strip-8.jpg', title: 'Chrome Primate', sub: 'HANGOVER', price: '\u20A952,000', href: '/studio/hangover/chrome-primate' },
];

export default function GalleryStrip() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0, moved: false });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    dragState.current = {
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.5;
    if (Math.abs(walk) > 5) dragState.current.moved = true;
    scrollRef.current.scrollLeft = dragState.current.scrollLeft - walk;
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (dragState.current.moved) {
      e.preventDefault();
    }
  }, []);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = dir === 'left' ? -320 : 320;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.tag}>Bestsellers</div>
            <h2 className={styles.title}>Most Wasted</h2>
          </div>
          <div className={styles.arrows}>
            <button
              className={styles.arrowBtn}
              onClick={() => scroll('left')}
              aria-label="Previous"
            >
              &#8249;
            </button>
            <button
              className={styles.arrowBtn}
              onClick={() => scroll('right')}
              aria-label="Next"
            >
              &#8250;
            </button>
          </div>
        </div>
        <p className={styles.sub}>벽에서 가장 빨리 사라지는 작품들.</p>
      </div>

      <div
        className={`${styles.track} ${isDragging ? styles.trackDragging : ''}`}
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {STRIP_ITEMS.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className={styles.card}
            prefetch={false}
            onClick={handleClick}
            draggable={false}
          >
            <Image
              src={item.image}
              alt={`${item.title} poster`}
              width={300}
              height={400}
              sizes="(max-width: 767px) 220px, 300px"
              draggable={false}
            />
            <div className={styles.info}>
              <div className={styles.cardSub}>{item.sub}</div>
              <div className={styles.cardTitle}>{item.title}</div>
              <div className={styles.cardPrice}>{item.price}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

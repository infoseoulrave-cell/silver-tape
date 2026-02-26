'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from './HeroCarousel.module.css';

interface HeroSlide {
  image: string;
  tag: string;
  title: string;
  subtitle: string;
}

const SLIDES: HeroSlide[] = [
  {
    image: '/images/hero/hero-impasto-emotion.png',
    tag: 'Top Shelf — 이번 주 기대작',
    title: 'Impasto Emotion',
    subtitle: '감정은 마르지 않는다. 물감처럼 덧칠할 뿐.',
  },
  {
    image: '/images/hero/hero-melancholy-youth.png',
    tag: 'Neo-Pop Portrait 시리즈',
    title: 'Melancholy Youth',
    subtitle: '젊음은 한 번뿐이지만, 그 우울은 벽에 영원히 남는다.',
  },
  {
    image: '/images/hero/hero-glass-hammer.png',
    tag: 'SENSIBILITY STAIR',
    title: 'Glass Hammer',
    subtitle: '힘의 도구가 유리가 될 때, 기능과 불가능 사이의 긴장.',
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const heroRef = useRef<HTMLElement>(null);

  const goTo = useCallback((n: number) => {
    setCurrent(n);
  }, []);

  const goNext = useCallback(() => {
    setCurrent(prev => (prev + 1) % SLIDES.length);
  }, []);

  const goPrev = useCallback(() => {
    setCurrent(prev => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(goNext, 6000);
  }, [goNext]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoPlay]);

  // Touch swipe support
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (diff > 0) goNext();
        else goPrev();
        startAutoPlay();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [goNext, goPrev, startAutoPlay]);

  const handleDotClick = (n: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    goTo(n);
    startAutoPlay();
  };

  return (
    <section className={styles.hero} ref={heroRef}>
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`${styles.slide} ${i === current ? styles.slideActive : ''}`}
        >
          <div
            className={styles.bg}
            style={{ backgroundImage: `url('${slide.image}')` }}
          />
          <div className={styles.gradient} />
          {i === current && (
            <div className={styles.content}>
              <div className={styles.tag}>{slide.tag}</div>
              <h1 className={styles.title}>{slide.title}</h1>
              <p className={styles.subtitle}>{slide.subtitle}</p>
              <div className={styles.cta}>
                <Link href="/products" className={styles.btnPrimary}>
                  전체 작품 보기
                </Link>
                <Link href="/products" className={styles.btnSecondary}>
                  이번 주 기대작
                </Link>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className={styles.dots}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => handleDotClick(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

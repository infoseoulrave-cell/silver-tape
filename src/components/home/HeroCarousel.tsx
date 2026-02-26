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
    image: '/images/hero/hero-rubber-duck.png',
    tag: 'Top Shelf — 이번 주 기대작',
    title: 'Rubber Duck Museum',
    subtitle: '미술관에 전시된 거대한 러버덕. 진지함과 유머의 경계.',
  },
  {
    image: '/images/hero/hero-neon-flamingo.png',
    tag: 'Cyberpunk Nature 시리즈',
    title: 'Neon Flamingo',
    subtitle: '비 내리는 도쿄 골목, 핑크 네온이 밤을 물들이다.',
  },
  {
    image: '/images/hero/hero-monument.png',
    tag: 'Cinema 시리즈',
    title: 'Monument',
    subtitle: '광활한 사막의 아치. 영화 한 장면 같은 순간.',
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

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from './HeroCarousel.module.css';

interface HeroSlide {
  image: string;
  tag: string;
  title: string;
  subtitle: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}

const SLIDES: HeroSlide[] = [
  {
    image: '/images/products/sensibility/sens-001-art.png',
    tag: 'SENSIBILITY STAIR — Surreal Still Life',
    title: 'Irrational Table',
    subtitle: '가만히 있기를 거부하는 초현실적 정물. 모든 오브제가 서로를 모순한다 — 그것이 요점이다.',
    primaryHref: '/studio/sensibility',
    primaryLabel: '전체 작품 보기',
    secondaryHref: '/studios',
    secondaryLabel: '스튜디오 둘러보기',
  },
  {
    image: '/images/hero/hero-glass-hammer.png',
    tag: 'SENSIBILITY STAIR — Object Study',
    title: 'Glass Hammer',
    subtitle: '유리로 만든 망치. 깨지기 쉬운 힘에 대한 조용한 질문.',
    primaryHref: '/studio/sensibility',
    primaryLabel: '전체 작품 보기',
    secondaryHref: '/studios',
    secondaryLabel: '스튜디오 둘러보기',
  },
  {
    image: '/images/products/sensibility/sens-003-art.png',
    tag: 'SENSIBILITY STAIR — Material Tension',
    title: 'Emergency Foil',
    subtitle: '비상 담요는 체온을 지킨다. 이 작품은 체면을 지킨다.',
    primaryHref: '/studio/sensibility',
    primaryLabel: '전체 작품 보기',
    secondaryHref: '/studios',
    secondaryLabel: '스튜디오 둘러보기',
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

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    intervalRef.current = setInterval(goNext, 6000);
  }, [goNext, stopAutoPlay]);

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

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
    <section
      className={styles.hero}
      ref={heroRef}
      onMouseEnter={stopAutoPlay}
      onMouseLeave={startAutoPlay}
    >
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
                <Link href={slide.primaryHref} className={styles.btnPrimary}>
                  {slide.primaryLabel}
                </Link>
                <Link href={slide.secondaryHref} className={styles.btnSecondary}>
                  {slide.secondaryLabel}
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

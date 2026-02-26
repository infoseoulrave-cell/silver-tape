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
    image: '/images/hero/hero-neon-flamingo.png',
    tag: 'HANGOVER — Cyberpunk × Nature',
    title: 'Neon Flamingo',
    subtitle: '사이버펑크가 자연과 만나는 곳. 빗물 웅덩이에 핑크 빛이 반사된다.',
  },
  {
    image: '/images/hero/hero-monument.png',
    tag: 'VOID. — Anti-Monument',
    title: 'Monument to Absence',
    subtitle: '아무것도 기념하지 않는 기념비. 그래서 모든 것을 기념한다.',
  },
  {
    image: '/images/products/sensibility/sens-003-art.png',
    tag: 'SENSIBILITY STAIR — Material Tension',
    title: 'Emergency Foil',
    subtitle: '비상 담요는 체온을 지킨다. 이 작품은 체면을 지킨다.',
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
                <Link href="/studio/hangover" className={styles.btnPrimary}>
                  전체 작품 보기
                </Link>
                <Link href="#studios" className={styles.btnSecondary}>
                  스튜디오 둘러보기
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

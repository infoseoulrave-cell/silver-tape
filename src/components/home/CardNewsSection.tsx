'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './CardNewsSection.module.css';

interface CardNewsTopic {
  id: number;
  themeLabel: string;
  title: string;
  accent: string;
}

const TOPICS: CardNewsTopic[] = [
  { id: 1, themeLabel: '과거의 물감', title: '1만 9천 년 전, 동굴 벽화의 색은?', accent: '#8B4513' },
  { id: 2, themeLabel: '과거의 물감', title: '보라색이 금만큼 비쌌던 시대', accent: '#6C3483' },
  { id: 3, themeLabel: '과거의 물감', title: '유화가 르네상스를 바꿨다', accent: '#C0392B' },
  { id: 4, themeLabel: '과거의 물감', title: '물감이 튜브에 담기기까지', accent: '#7D6608' },
  { id: 5, themeLabel: '색의 심리학', title: '빨강이 심박수를 올린다', accent: '#C0392B' },
  { id: 6, themeLabel: '색의 심리학', title: '파랑은 왜 신뢰의 색일까?', accent: '#1A5276' },
  { id: 7, themeLabel: '색의 심리학', title: '초록이 눈을 편하게 하는 과학적 이유', accent: '#145A32' },
  { id: 8, themeLabel: '미술사 미스터리', title: '모나리자 도난: 루브르가 빈 벽을 전시한 날', accent: '#4A235A' },
  { id: 9, themeLabel: '미술사 미스터리', title: '5억 달러의 미술품이 아직도 사라진 채', accent: '#922B21' },
  { id: 10, themeLabel: '미술사 미스터리', title: '"인상주의"라는 이름은 조롱이었다', accent: '#0E6655' },
  { id: 11, themeLabel: '화가 이야기', title: '고흐, 생전에 팔린 그림은 단 1점', accent: '#7D6608' },
  { id: 12, themeLabel: '화가 이야기', title: '다빈치 vs 미켈란젤로: 세기의 라이벌', accent: '#2C3E50' },
  { id: 13, themeLabel: '화가 이야기', title: '프리다 칼로: 고통이 만든 예술', accent: '#C0392B' },
  { id: 14, themeLabel: '화가 이야기', title: "뭉크 '절규' 속 하늘의 비밀", accent: '#E74C3C' },
  { id: 15, themeLabel: '디지털 vs 필름', title: '필름은 화학, 디지털은 전기', accent: '#1C2833' },
  { id: 16, themeLabel: '디지털 vs 필름', title: 'MZ세대가 필름을 다시 찾는 이유', accent: '#7D3C98' },
  { id: 17, themeLabel: '사진 예술', title: '흑백사진이 더 감성적인 이유', accent: '#2C3E50' },
  { id: 18, themeLabel: '사진 예술', title: '세계에서 가장 비싼 사진 작품', accent: '#4A235A' },
  { id: 19, themeLabel: '작품이 주는 효과', title: '미술치료: 우울 점수 55→12', accent: '#7D3C98' },
  { id: 20, themeLabel: '작품이 주는 효과', title: '병원에 그림을 걸면 생기는 일', accent: '#1A5276' },
  { id: 21, themeLabel: '작품이 주는 효과', title: '사무실 그림이 창의력을 높인다', accent: '#145A32' },
  { id: 22, themeLabel: '현대미술 이슈', title: '2025 경매 TOP 3 전부 클림트', accent: '#7D6608' },
  { id: 23, themeLabel: '현대미술 이슈', title: '디지털 아트, 예술일까?', accent: '#1C2833' },
  { id: 24, themeLabel: '현대미술 이슈', title: '현대미술이 어려운 진짜 이유', accent: '#4A235A' },
  { id: 25, themeLabel: '미술품 있는 집', title: '그림 한 점이 거실을 바꾼다', accent: '#7D6608' },
  { id: 26, themeLabel: '미술품 있는 집', title: '미니멀리즘 인테리어의 함정', accent: '#2C3E50' },
  { id: 27, themeLabel: '미술품 있는 집', title: '북유럽에 그림이 필수인 이유', accent: '#1A5276' },
  { id: 28, themeLabel: '아트 라이프 팁', title: '나만의 갤러리 월 만들기', accent: '#6C3483' },
  { id: 29, themeLabel: '아트 라이프 팁', title: '그림으로 계절을 바꾸는 법', accent: '#0E6655' },
  { id: 30, themeLabel: '아트 라이프 팁', title: '카페에 그림 한 점이면 분위기가 달라진다', accent: '#922B21' },
];

export default function CardNewsSection() {
  const [activeTopic, setActiveTopic] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const topic = TOPICS[activeTopic];
  const pad = String(topic.id).padStart(2, '0');

  const goNext = useCallback(() => {
    if (activeSlide < 2) {
      setActiveSlide(s => s + 1);
    } else if (activeTopic < TOPICS.length - 1) {
      setActiveTopic(t => t + 1);
      setActiveSlide(0);
    }
  }, [activeSlide, activeTopic]);

  const goPrev = useCallback(() => {
    if (activeSlide > 0) {
      setActiveSlide(s => s - 1);
    } else if (activeTopic > 0) {
      setActiveTopic(t => t - 1);
      setActiveSlide(2);
    }
  }, [activeSlide, activeTopic]);

  // Scroll topic pills into view (horizontal only, don't scroll page)
  const hasInteracted = useRef(false);
  useEffect(() => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    const btn = el.children[activeTopic] as HTMLElement;
    if (btn) {
      const left = btn.offsetLeft - el.offsetWidth / 2 + btn.offsetWidth / 2;
      el.scrollTo({ left, behavior: 'smooth' });
    }
  }, [activeTopic]);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.tag}>ART INSIGHT</div>
        <h2 className={styles.title}>아트 인사이트</h2>
        <p className={styles.desc}>미술과 일상을 잇는 30가지 이야기</p>
      </div>

      {/* Topic pills */}
      <div className={styles.pillScroll} ref={scrollRef}>
        {TOPICS.map((t, i) => (
          <button
            key={t.id}
            className={`${styles.pill} ${i === activeTopic ? styles.pillActive : ''}`}
            style={i === activeTopic ? { background: t.accent } : undefined}
            onClick={() => { setActiveTopic(i); setActiveSlide(0); }}
          >
            {t.title.length > 16 ? t.title.slice(0, 16) + '...' : t.title}
          </button>
        ))}
      </div>

      {/* Carousel viewer */}
      <div
        className={styles.viewer}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) {
            if (diff > 0) goNext();
            else goPrev();
          }
        }}
      >
        <div className={styles.imageWrapper}>
          <Image
            key={`${pad}-${activeSlide + 1}`}
            src={`/instagram/card-news/card-${pad}-${activeSlide + 1}.png`}
            alt={`${topic.title} (${activeSlide + 1}/3)`}
            width={1080}
            height={1350}
            className={styles.image}
            priority={activeTopic < 3}
          />

          {/* Nav arrows */}
          <button
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={goPrev}
            disabled={activeTopic === 0 && activeSlide === 0}
            aria-label="Previous"
          >
            &#8249;
          </button>
          <button
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={goNext}
            disabled={activeTopic === TOPICS.length - 1 && activeSlide === 2}
            aria-label="Next"
          >
            &#8250;
          </button>
        </div>

        {/* Slide dots */}
        <div className={styles.dots}>
          {[0, 1, 2].map(i => (
            <button
              key={i}
              className={`${styles.dot} ${i === activeSlide ? styles.dotActive : ''}`}
              style={i === activeSlide ? { background: topic.accent } : undefined}
              onClick={() => setActiveSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Topic info */}
        <div className={styles.topicInfo}>
          <span className={styles.topicLabel} style={{ color: topic.accent }}>
            {topic.themeLabel}
          </span>
          <h3 className={styles.topicTitle}>{topic.title}</h3>
          <span className={styles.topicCount}>{topic.id} / 30</span>
        </div>
      </div>
    </section>
  );
}

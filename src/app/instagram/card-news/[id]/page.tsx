'use client';

import { useParams } from 'next/navigation';
import { CARD_NEWS } from '@/data/card-news';
import styles from './card.module.css';

/** 단일 카드 1080×1350 (4:5) — 스크린샷/캡처용 */
export default function CardNewsSinglePage() {
  const params = useParams();
  const id = Number(params?.id);
  const item = CARD_NEWS.find((c) => c.id === id);

  if (!item) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card} style={{ background: '#333' }}>
          <p>카드를 찾을 수 없습니다. (id: {String(params?.id)})</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div
        data-card
        className={styles.card}
        style={
          item.image
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 100%), url(${item.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {
                background: `linear-gradient(160deg, ${item.accent} 0%, ${darken(item.accent, 0.4)} 100%)`,
              }
        }
      >
        <span className={styles.theme}>{item.themeLabel}</span>
        <h1 className={styles.title}>{item.title}</h1>
        <div className={styles.lines}>
          {item.lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <span className={styles.number}>{item.id} / 30</span>
      </div>
    </div>
  );
}

function darken(hex: string, amount: number): string {
  const n = hex.replace('#', '');
  const r = Math.max(0, parseInt(n.slice(0, 2), 16) * (1 - amount));
  const g = Math.max(0, parseInt(n.slice(2, 4), 16) * (1 - amount));
  const b = Math.max(0, parseInt(n.slice(4, 6), 16) * (1 - amount));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

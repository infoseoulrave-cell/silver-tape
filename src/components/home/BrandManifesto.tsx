'use client';

import { useEffect, useState } from 'react';
import styles from './BrandManifesto.module.css';

interface Quote {
  text: string;
  accent: string;
}

const QUOTES: Quote[] = [
  { text: 'Serious, yet', accent: 'Absurd.' },
  { text: '진지하되,', accent: '아이러니.' },
  { text: 'Art on', accent: 'Every Wall.' },
  { text: '모든 벽 위에,', accent: '감각.' },
  { text: 'Find Truth in', accent: 'Irony.' },
  { text: '아이러니 속의', accent: '진실.' },
];

export default function BrandManifesto() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % QUOTES.length);
        setVisible(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const quote = QUOTES[index];

  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <div
          className={styles.quote}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          {quote.text} <span className={styles.accent}>{quote.accent}</span>
        </div>
        <div className={styles.line} />
        <p className={styles.kr}>
          벽 위의 한 장이 시선을 멈추게 한다.<br />
          그것이 우리가 예술을 믿는 이유다.
        </p>
      </div>
    </section>
  );
}

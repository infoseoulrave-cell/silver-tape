'use client';

import { useEffect, useState } from 'react';
import styles from './BrandManifesto.module.css';

interface Quote {
  text: string;
  accent: string;
}

const QUOTES: Quote[] = [
  { text: 'Visual', accent: 'Excess.' },
  { text: '과잉의', accent: '미학.' },
  { text: 'Wall', accent: 'Obsession.' },
  { text: '벽 위의', accent: '집착.' },
  { text: 'Get Wasted on', accent: 'Art.' },
  { text: '예술에', accent: '취하다.' },
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
          좋은 포스터는 숙취처럼 남는다.<br />
          걸어라. 취해라. 매일매일.
        </p>
      </div>
    </section>
  );
}

'use client';

import { useState, useCallback } from 'react';
import styles from '../info.module.css';

interface FaqEntry {
  q: string;
  a: string;
}

interface FaqSection {
  title: string;
  items: FaqEntry[];
}

interface FaqClientProps {
  data: FaqSection[];
}

export default function FaqClient({ data }: FaqClientProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = useCallback((key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <div className={styles.body}>
      {data.map(section => (
        <div key={section.title}>
          <h2>{section.title}</h2>
          {section.items.map((item, i) => {
            const key = `${section.title}-${i}`;
            const isOpen = openItems.has(key);
            return (
              <div key={key} className={styles.faqItem}>
                <button
                  className={styles.faqQuestion}
                  onClick={() => toggle(key)}
                  aria-expanded={isOpen}
                >
                  {item.q}
                  <span className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d={isOpen ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                <div className={`${styles.faqAnswer} ${isOpen ? styles.faqAnswerOpen : ''}`}>
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div className={styles.contactBox}>
        <p>원하는 답변을 찾지 못하셨나요?</p>
        <p><a href="mailto:hello@silvertape.art">hello@silvertape.art</a></p>
      </div>
    </div>
  );
}

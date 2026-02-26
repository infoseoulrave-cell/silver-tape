import Link from 'next/link';
import { CARD_NEWS, CARD_NEWS_THEMES } from '@/data/card-news';
import styles from './list.module.css';

export const metadata = {
  title: '인스타그램 카드뉴스',
  description: 'Silvertape 인스타그램 피드용 카드뉴스 30종 (4:5)',
};

export default function CardNewsListPage() {
  const byTheme = CARD_NEWS_THEMES.map((t) => ({
    ...t,
    items: CARD_NEWS.filter((c) => c.theme === t.key),
  }));

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.h1}>인스타그램 카드뉴스</h1>
        <p className={styles.sub}>1080×1350 (4:5) · 리서치 기반 30종</p>
        <p className={styles.hint}>
          카드를 클릭하면 단일 뷰에서 캡처하거나 스크린샷으로 저장할 수 있습니다.
        </p>
      </header>

      {byTheme.map((group) => (
        <section key={group.key} className={styles.section}>
          <h2 className={styles.h2}>{group.label}</h2>
          <ul className={styles.grid}>
            {group.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/instagram/card-news/${item.id}`}
                  className={styles.link}
                  style={{ background: item.accent }}
                >
                  <span className={styles.thumbTitle}>{item.title}</span>
                  <span className={styles.thumbMeta}>{item.id} / 30</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

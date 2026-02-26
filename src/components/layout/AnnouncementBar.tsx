import styles from './AnnouncementBar.module.css';

const MESSAGES = [
  { text: '이상 무료배송', accent: '5만원', accentFirst: true },
  { text: '매주 금요일 신작 공개', accent: '// FRESH POUR', accentFirst: false },
  { text: '한정판은 한 번 품절되면', accent: '끝', accentFirst: false, suffix: '입니다' },
];

export default function AnnouncementBar() {
  const items = [...MESSAGES, ...MESSAGES];

  return (
    <div className={styles.bar}>
      <div className={styles.track}>
        {items.map((msg, i) => (
          <span key={i} className={styles.item}>
            {msg.accentFirst && <span className={styles.accent}>{msg.accent}</span>}{' '}
            {msg.text}
            {!msg.accentFirst && (
              <>
                {' '}<span className={styles.accent}>{msg.accent}</span>
              </>
            )}
            {msg.suffix}
          </span>
        ))}
      </div>
    </div>
  );
}

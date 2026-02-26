import Link from 'next/link';
import styles from './Footer.module.css';

const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? '';
const TWITTER_URL = process.env.NEXT_PUBLIC_TWITTER_URL ?? '';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <span className={styles.logoSilver}>SILVER</span>
            <svg className={styles.logoMark} viewBox="0 0 14 24" aria-hidden="true">
              <rect x="3" y="0" width="8" height="24" rx="1.5" transform="rotate(-14 7 12)" />
            </svg>
            <span className={styles.brandAccent}>TAPE</span>
          </div>
          <p>
            Tape Art to Your Wall.<br />
            모든 벽에 센세이션을.
          </p>
        </div>
        <div className={styles.col}>
          <h4>스튜디오</h4>
          <Link href="/studio/hangover">HANGOVER</Link>
          <Link href="/studio/void">VOID.</Link>
          <Link href="/studio/sensibility">SENSIBILITY STAIR</Link>
        </div>
        <div className={styles.col}>
          <h4>안내</h4>
          <Link href="/about">플랫폼 소개</Link>
          <Link href="/faq">자주 묻는 질문</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보처리방침</Link>
        </div>
        <div className={styles.col}>
          <h4>소셜</h4>
          {INSTAGRAM_URL && (
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram</a>
          )}
          {TWITTER_URL && (
            <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer">Twitter</a>
          )}
          <Link href="/#newsletter">뉴스레터</Link>
          <a href="mailto:hello@silvertape.art">문의하기</a>
        </div>
      </div>
      <div className={styles.bizInfo}>
        <p>
          상호: 서울레이브 | 대표: 조민호 | 사업자등록번호: 636-78-00472
        </p>
        <p>
          통신판매업신고: 2025-부산해운대-0975 | 주소: 부산광역시 해운대구 달맞이길 65번길 151
        </p>
        <p>
          이메일: <a href="mailto:info.seoulrave@gmail.com">info.seoulrave@gmail.com</a> | 전화: +82-10-4092-8459
        </p>
      </div>
      <div className={styles.bottom}>
        <span>&copy; 2026 SILVERTAPE. All rights reserved.</span>
        <span>silvertape.art</span>
      </div>
    </footer>
  );
}

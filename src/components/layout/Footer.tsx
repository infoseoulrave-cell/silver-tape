import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            SILVER<span className={styles.brandAccent}>TAPE</span>
          </div>
          <p>
            아트 스튜디오 중계 플랫폼.<br />
            Curated Art. Every Wall.<br />
            모든 벽에 예술을.
          </p>
        </div>
        <div className={styles.col}>
          <h4>스튜디오</h4>
          <Link href="/studio/hangover">HANGOVER</Link>
          <Link href="/studio/hangover">신작</Link>
          <Link href="/studio/hangover">베스트셀러</Link>
        </div>
        <div className={styles.col}>
          <h4>안내</h4>
          <Link href="/about">플랫폼 소개</Link>
          <Link href="/faq">배송 안내</Link>
          <Link href="/faq">교환/반품</Link>
          <Link href="/faq">자주 묻는 질문</Link>
        </div>
        <div className={styles.col}>
          <h4>소셜</h4>
          <a href="#" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="#" target="_blank" rel="noopener noreferrer">Twitter</a>
          <Link href="/#newsletter">뉴스레터</Link>
          <a href="mailto:hello@silvertape.art">문의하기</a>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>&copy; 2026 SILVERTAPE. All rights reserved.</span>
        <span>silvertape.art</span>
      </div>
    </footer>
  );
}

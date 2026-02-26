import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            HANG<span className={styles.brandAccent}>O</span>VER
          </div>
          <p>
            AI가 만든 그래픽 아트 포스터.<br />
            Visual Excess. Wall Obsession.<br />
            예술에 취하다.
          </p>
        </div>
        <div className={styles.col}>
          <h4>쇼핑</h4>
          <Link href="/products">전체 작품</Link>
          <Link href="/products">신작</Link>
          <Link href="/products">베스트셀러</Link>
          <Link href="/products">한정판</Link>
        </div>
        <div className={styles.col}>
          <h4>안내</h4>
          <Link href="/about">브랜드 소개</Link>
          <Link href="/faq">배송 안내</Link>
          <Link href="/faq">교환/반품</Link>
          <Link href="/faq">자주 묻는 질문</Link>
        </div>
        <div className={styles.col}>
          <h4>소셜</h4>
          <a href="#" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="#" target="_blank" rel="noopener noreferrer">Twitter</a>
          <Link href="/#newsletter">뉴스레터</Link>
          <a href="mailto:hello@hangover-art.com">문의하기</a>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>&copy; 2026 HANGOVER. All rights reserved.</span>
        <span>hangover-art.com</span>
      </div>
    </footer>
  );
}

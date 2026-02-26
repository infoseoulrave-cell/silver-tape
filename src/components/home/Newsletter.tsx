'use client';

import { useState } from 'react';
import styles from './Newsletter.module.css';

export default function Newsletter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to newsletter API
    if (email) {
      alert('구독해주셔서 감사합니다!');
      setEmail('');
    }
  };

  return (
    <section className={styles.section} id="newsletter">
      <div className={styles.tag}>Stay Wasted</div>
      <h2 className={styles.title}>매주 한 잔, 예술 한 방</h2>
      <p className={styles.desc}>
        신작 공개, 비하인드 스토리, 한정판 소식을 가장 먼저. 스팸 없이, 예술만.
      </p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="email"
          className={styles.input}
          placeholder="이메일 주소를 입력하세요"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit" className={styles.btn}>
          구독하기
        </button>
      </form>
    </section>
  );
}

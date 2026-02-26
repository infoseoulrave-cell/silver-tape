import Image from 'next/image';
import styles from './GalleryStrip.module.css';

interface StripItem {
  image: string;
  title: string;
  sub: string;
  price: string;
}

const STRIP_ITEMS: StripItem[] = [
  { image: '/images/gallery-strip/strip-1.jpg', title: 'Rubber Duck Museum', sub: '팝 초현실', price: '\u20A945,000' },
  { image: '/images/gallery-strip/strip-2.jpg', title: 'Cosmic Ramen', sub: '초현실 미식', price: '\u20A942,000' },
  { image: '/images/gallery-strip/strip-3.jpg', title: 'Neon Flamingo', sub: '사이버펑크 자연', price: '\u20A948,000' },
  { image: '/images/gallery-strip/strip-4.jpg', title: 'Goldfish Cosmonaut', sub: '마이크로 오디세이', price: '\u20A938,000' },
  { image: '/images/gallery-strip/strip-5.jpg', title: 'Cactus Symphony', sub: '보태니컬 부조리', price: '\u20A955,000' },
  { image: '/images/gallery-strip/strip-6.jpg', title: 'Red Turtleneck', sub: '네오팝 인물화', price: '\u20A938,000' },
  { image: '/images/gallery-strip/strip-7.jpg', title: 'Salt Walker', sub: '시네마 시리즈', price: '\u20A942,000' },
  { image: '/images/gallery-strip/strip-8.jpg', title: 'Chrome Primate', sub: '크롬 초현실', price: '\u20A952,000' },
];

export default function GalleryStrip() {
  const items = [...STRIP_ITEMS, ...STRIP_ITEMS];

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.tag}>Bestsellers</div>
        <h2 className={styles.title}>Most Wasted</h2>
        <p className={styles.sub}>벽에서 가장 빨리 사라지는 작품들.</p>
      </div>

      <div className={styles.track}>
        {items.map((item, i) => (
          <div key={i} className={styles.card}>
            <Image
              src={item.image}
              alt={`${item.title} poster`}
              width={300}
              height={400}
              style={{ width: '100%', height: 'auto' }}
            />
            <div className={styles.info}>
              <div className={styles.cardTitle}>{item.title}</div>
              <div className={styles.cardSub}>{item.sub}</div>
              <div className={styles.cardPrice}>{item.price}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

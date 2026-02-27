import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getActiveStudios } from '@/data/studios';
import { getProductsByStudio } from '@/data/products';
import ProductCard from '@/components/product/ProductCard';
import ScrollReveal from '@/components/ui/ScrollReveal';
import styles from './studios.module.css';

export const metadata: Metadata = {
  title: 'Studios — Curated Art Studios',
  description: '독립 아트 스튜디오들의 세계관을 탐험하세요. 각 스튜디오가 큐레이팅한 프리미엄 아트 프린트.',
};

export default function StudiosPage() {
  const studios = getActiveStudios();

  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>Studios</h1>
          <p className={styles.heroSub}>각기 다른 시선, 각기 다른 세계관. 스튜디오를 탐험하세요.</p>
        </div>
      </div>

      {studios.map((studio, si) => {
        const products = getProductsByStudio(studio.slug);
        const preview = products.slice(0, 4);
        const isEven = si % 2 === 0;

        return (
          <section
            key={studio.id}
            className={`${styles.studioSection} ${isEven ? '' : styles.studioAlt}`}
          >
            <div className={styles.container}>
              <ScrollReveal>
                <div className={styles.studioHeader}>
                  <div
                    className={styles.studioAccent}
                    style={{ background: studio.accentColor }}
                  />
                  <div className={styles.studioInfo}>
                    <div className={styles.studioTag}>STUDIO</div>
                    <h2 className={styles.studioName}>{studio.name}</h2>
                    <p className={styles.studioTagline}>{studio.tagline}</p>
                    <p className={styles.studioDesc}>{studio.descriptionKo}</p>
                    <div className={styles.studioMeta}>
                      <span>{products.length}점</span>
                    </div>
                    <Link href={`/studio/${studio.slug}`} className={styles.studioBtn}>
                      Enter Studio &rarr;
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              <div className={styles.studioGrid}>
                {preview.map((product, i) => (
                  <ScrollReveal key={product.id} delay={i * 80}>
                    <ProductCard product={product} />
                  </ScrollReveal>
                ))}
              </div>

              {products.length > 4 && (
                <div className={styles.viewMore}>
                  <Link href={`/studio/${studio.slug}`} className={styles.viewMoreBtn}>
                    {studio.name} 전체 작품 보기 &rarr;
                  </Link>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </main>
  );
}

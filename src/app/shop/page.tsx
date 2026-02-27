import type { Metadata } from 'next';
import { PRODUCTS, getFeaturedProducts } from '@/data/products';
import ProductCard from '@/components/product/ProductCard';
import ScrollReveal from '@/components/ui/ScrollReveal';
import styles from './shop.module.css';

export const metadata: Metadata = {
  title: 'Shop — All Works',
  description: 'SILVERTAPE의 모든 작품을 만나보세요. 신작, 인기작, 그리고 전체 컬렉션.',
};

export default function ShopPage() {
  const featured = getFeaturedProducts().slice(0, 8);
  const newest = [...PRODUCTS].reverse().slice(0, 8);

  // Deduplicate featured from newest
  const featuredIds = new Set(featured.map(p => p.id));
  const newestFiltered = newest.filter(p => !featuredIds.has(p.id));

  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>Shop</h1>
          <p className={styles.heroSub}>큐레이션된 아트 프린트. 당신의 벽을 위한 감각.</p>
        </div>
      </div>

      {/* New Arrivals */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.tag}>New Arrivals</div>
            <h2 className={styles.sectionTitle}>신작</h2>
          </div>
          <div className={styles.grid}>
            {newestFiltered.slice(0, 4).map((product, i) => (
              <ScrollReveal key={product.id} delay={i * 80}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Popular / Featured */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.tag}>Popular</div>
            <h2 className={styles.sectionTitle}>인기작</h2>
          </div>
          <div className={styles.grid}>
            {featured.slice(0, 4).map((product, i) => (
              <ScrollReveal key={product.id} delay={i * 80}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* All Works */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.tag}>All Works</div>
            <h2 className={styles.sectionTitle}>전체 작품</h2>
            <p className={styles.sectionSub}>{PRODUCTS.length}점</p>
          </div>
          <div className={styles.grid}>
            {PRODUCTS.map((product, i) => (
              <ScrollReveal key={product.id} delay={i < 8 ? i * 60 : 0}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

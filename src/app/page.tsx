import Link from 'next/link';
import { getActiveStudios } from '@/data/studios';
import { getFeaturedProducts, PRODUCTS } from '@/data/products';
import ProductCard from '@/components/product/ProductCard';
import Newsletter from '@/components/home/Newsletter';
import styles from './platform.module.css';

export default function PlatformHome() {
  const studios = getActiveStudios();
  const featured = getFeaturedProducts().slice(0, 8);
  const latest = [...PRODUCTS].reverse().slice(0, 8);

  return (
    <main>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroTag}>ART STUDIO PLATFORM</div>
          <h1 className={styles.heroTitle}>
            SILVER<span className={styles.heroAccent}>TAPE</span>
          </h1>
          <p className={styles.heroSub}>
            Curated Art. Every Wall.
          </p>
          <p className={styles.heroDesc}>
            다양한 아트 스튜디오의 작품을 만나고,<br />
            포스터와 프린트로 소장하세요.
          </p>
          <Link href="/studio/hangover" className={styles.heroCta}>
            스튜디오 둘러보기
          </Link>
        </div>
      </section>

      {/* Studios */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>STUDIOS</div>
          <h2 className={styles.sectionTitle}>입점 스튜디오</h2>
        </div>
        <div className={styles.studioGrid}>
          {studios.map(studio => (
            <Link
              key={studio.id}
              href={`/studio/${studio.slug}`}
              className={styles.studioCard}
              style={{ '--studio-accent': studio.accentColor } as React.CSSProperties}
            >
              <div className={styles.studioLogo}>{studio.name}</div>
              <p className={styles.studioTagline}>{studio.tagline}</p>
              <p className={styles.studioDesc}>{studio.descriptionKo}</p>
              <div className={styles.studioMeta}>
                <span className={styles.studioEnter}>ENTER STUDIO</span>
                <span className={styles.studioArrow}>&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>FEATURED</div>
          <h2 className={styles.sectionTitle}>추천 작품</h2>
        </div>
        <div className={styles.productGrid}>
          {featured.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Latest */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>NEW DROPS</div>
          <h2 className={styles.sectionTitle}>최신 작품</h2>
        </div>
        <div className={styles.productGrid}>
          {latest.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* About Platform */}
      <section className={styles.about}>
        <div className={styles.aboutInner}>
          <div className={styles.aboutTag}>ABOUT</div>
          <h2 className={styles.aboutTitle}>
            모든 아티스트에게 갤러리를,<br />
            모든 벽에 예술을.
          </h2>
          <p className={styles.aboutDesc}>
            SILVERTAPE는 아트 스튜디오 중계 플랫폼입니다.<br />
            AI 아트부터 디지털 아트까지, 다양한 스튜디오의 작품을<br />
            프리미엄 포스터와 프레임으로 제작하여 배송합니다.
          </p>
        </div>
      </section>

      <Newsletter />
    </main>
  );
}

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
            Tape Art to Your Wall.
          </p>
          <p className={styles.heroDesc}>
            바나나를 벽에 붙인 실버 테이프처럼,<br />
            당신의 벽 위에 센세이션을 고정합니다.
          </p>
          <Link href="#studios" className={styles.heroCta}>
            스튜디오 둘러보기
          </Link>
        </div>
      </section>

      {/* Studios */}
      <section id="studios" className={styles.section}>
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

      {/* Brand Story */}
      <section className={styles.story}>
        <div className={styles.storyInner}>
          <div className={styles.storyTag}>OUR STORY</div>
          <h2 className={styles.storyTitle}>
            바나나 한 개,<br />
            실버 테이프 한 조각.
          </h2>
          <div className={styles.storyBody}>
            <p>
              2019년, 마우리치오 카텔란은 바나나 한 개를 실버 덕테이프로
              벽에 붙였다. 그것만으로 세상은 뒤집어졌다.
            </p>
            <p>
              12만 달러짜리 바나나가 아니었다.
              12만 달러짜리 <em>질문</em>이었다 &mdash;
              &ldquo;예술이란 무엇인가?&rdquo;
            </p>
            <p>
              우리는 그 질문에 매료됐다. 그리고 답 대신 플랫폼을 만들었다.
            </p>
            <p>
              <strong>SILVERTAPE</strong>는 작품을 벽에 붙이는 행위 자체를 예술로 만든다.
              AI가 그린 비전, 인간이 큐레이팅한 감각, 프리미엄 프린트의 물성 &mdash;
              세 개의 레이어가 하나의 실버 테이프로 당신의 벽 위에 고정된다.
            </p>
            <p>
              카텔란의 테이프가 미술관 벽 위에서 센세이션을 일으켰듯,<br />
              우리의 테이프는 당신의 벽 위에서 일상을 뒤집는다.
            </p>
          </div>
          <div className={styles.storySignoff}>
            Every wall deserves a sensation.
          </div>
        </div>
      </section>

      {/* About Platform */}
      <section className={styles.about}>
        <div className={styles.aboutInner}>
          <div className={styles.aboutTag}>PLATFORM</div>
          <h2 className={styles.aboutTitle}>
            모든 아티스트에게 갤러리를,<br />
            모든 벽에 센세이션을.
          </h2>
          <p className={styles.aboutDesc}>
            SILVERTAPE는 아트 스튜디오 중계 플랫폼입니다.<br />
            AI 아트부터 컨템포러리 디지털 아트까지,<br />
            다양한 스튜디오의 작품을 프리미엄 프린트로 제작하여<br />
            당신의 벽 위에 붙여드립니다.
          </p>
        </div>
      </section>

      <Newsletter />
    </main>
  );
}

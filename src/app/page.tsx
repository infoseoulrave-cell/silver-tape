import Link from 'next/link';
import { getActiveStudios } from '@/data/studios';
import { getFeaturedProducts, PRODUCTS } from '@/data/products';
import HeroCarousel from '@/components/home/HeroCarousel';
import ProductShowcase from '@/components/home/ProductShowcase';
import GalleryStrip from '@/components/home/GalleryStrip';
import BrandManifesto from '@/components/home/BrandManifesto';
import ProductCard from '@/components/product/ProductCard';
import CardNewsSection from '@/components/home/CardNewsSection';
import Newsletter from '@/components/home/Newsletter';
import ScrollReveal from '@/components/ui/ScrollReveal';
import styles from './platform.module.css';

export default function PlatformHome() {
  const studios = getActiveStudios();
  const featured = getFeaturedProducts().slice(0, 4);
  const latest = [...PRODUCTS].reverse().slice(0, 8);

  // Merge featured + latest, deduplicate by id
  const seen = new Set<string>();
  const curated = [...featured, ...latest].filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }).slice(0, 12);

  return (
    <main>
      <h1 className="sr-only">SILVERTAPE — 큐레이션 아트 프린트 플랫폼</h1>
      {/* Hero Carousel — full-bleed visual impact */}
      <HeroCarousel />

      {/* 이번 주 기대작 — Top Shelf */}
      <ScrollReveal>
        <ProductShowcase />
      </ScrollReveal>

      {/* Trust Bar */}
      <ScrollReveal>
        <div className={styles.trustBar}>
          <span>프리미엄 아트 프린트</span>
          <span className={styles.trustDot}>&middot;</span>
          <span>3~5일 내 배송</span>
          <span className={styles.trustDot}>&middot;</span>
          <span>7일 이내 교환/반품</span>
          <span className={styles.trustDot}>&middot;</span>
          <span>4개 큐레이션 스튜디오</span>
        </div>
      </ScrollReveal>

      {/* Curated Works */}
      <ScrollReveal>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>CURATED</div>
            <h2 className={styles.sectionTitle}>큐레이션</h2>
          </div>
          <div className={styles.productGrid}>
            {curated.map((product, i) => (
              <ScrollReveal key={product.id} delay={i < 4 ? i * 80 : 0}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Bestseller Strip */}
      <ScrollReveal>
        <GalleryStrip />
      </ScrollReveal>

      {/* Art Insight — Card News */}
      <ScrollReveal>
        <CardNewsSection />
      </ScrollReveal>

      {/* Studios */}
      <ScrollReveal>
        <section id="studios" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>STUDIOS</div>
            <h2 className={styles.sectionTitle}>입점 스튜디오</h2>
          </div>
          <div className={styles.studioGrid}>
            {studios.map((studio, i) => (
              <ScrollReveal key={studio.id} delay={i * 100}>
                <Link
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
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Brand Manifesto */}
      <ScrollReveal variant="scale">
        <BrandManifesto />
      </ScrollReveal>

      {/* Brand Story */}
      <ScrollReveal>
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
                12만 달러짜리 바나나가 아니었다.
                12만 달러짜리 <em>질문</em>이었다 &mdash;
                &ldquo;예술이란 무엇인가?&rdquo;
              </p>
              <p>
                예술은 원래 그런 것이다.
                지극히 진지하면서도 터무니없이 아이러니하고,
                그 아이러니 속에서 불현듯 진실이 튀어나온다.
                미술관 벽에 붙은 바나나가 12만 달러인 세상은 황당하지만,
                그 황당함 앞에서 멈춰 서게 만드는 것 &mdash;
                그것이 예술이 가진 유일한 힘이다.
              </p>
              <p>
                우리는 그 힘을 믿는다.
                누군가의 일상에 스며들어 걸음을 멈추게 하는 한 장의 그림,
                무심히 벽에 걸어두었는데 어느 날 문득 눈이 가는 포스터,
                설명할 수 없지만 분명히 존재하는 그 감각.
              </p>
              <p>
                <strong>SILVERTAPE</strong>는 그 감각을 전하기 위해 만들어진 플랫폼이다.
                각기 다른 시선을 가진 스튜디오들이 큐레이션한 작품을,
                프리미엄 프린트라는 물성 위에 올려
                당신의 벽 위에 고정한다 &mdash; 실버 테이프처럼 단단하게.
              </p>
              <p>
                카텔란이 던진 질문에 대한 우리의 대답은 단순하다.
                예술은 미술관에만 있지 않다.
                당신이 매일 마주하는 벽 위에 있다.
              </p>
            </div>
            <div className={styles.storySignoff}>
              Every wall deserves a sensation.
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <Newsletter />
      </ScrollReveal>
    </main>
  );
}

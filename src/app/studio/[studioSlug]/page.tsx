import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductGrid from '@/components/product/ProductGrid';
import { getStudioBySlug, STUDIOS } from '@/data/studios';
import { getProductsByStudio } from '@/data/products';
import styles from './studio.module.css';

interface StudioPageProps {
  params: Promise<{ studioSlug: string }>;
}

export async function generateStaticParams() {
  return STUDIOS.map(s => ({ studioSlug: s.slug }));
}

export async function generateMetadata({ params }: StudioPageProps): Promise<Metadata> {
  const { studioSlug } = await params;
  const studio = getStudioBySlug(studioSlug);
  if (!studio) return { title: 'Studio Not Found' };

  return {
    title: `${studio.name} — ${studio.tagline}`,
    description: studio.descriptionKo,
    openGraph: {
      title: `${studio.name} | SILVERTAPE`,
      description: studio.descriptionKo,
    },
  };
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { studioSlug } = await params;
  const studio = getStudioBySlug(studioSlug);
  if (!studio) notFound();

  const products = getProductsByStudio(studioSlug);
  const bestSellers = products.filter(p => p.featured);

  return (
    <main>
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: studio.name }]} />

      {/* Studio Hero */}
      <div className={styles.hero} style={{ '--studio-accent': studio.accentColor } as React.CSSProperties}>
        <div className={styles.heroContent}>
          <div className={styles.heroTag}>STUDIO</div>
          <h1 className={styles.heroTitle}>{studio.name}</h1>
          <p className={styles.heroTagline}>{studio.tagline}</p>
          <p className={styles.heroDesc}>{studio.descriptionKo}</p>
          <div className={styles.heroStats}>
            <span>{products.length} 작품</span>
          </div>
        </div>
      </div>

      {/* Best Seller */}
      {bestSellers.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>BEST SELLER</h2>
          <div className={styles.grid}>
            <ProductGrid products={bestSellers} studioSlug={studioSlug} />
          </div>
        </div>
      )}

      {/* All Products */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>ALL WORKS — {products.length}점</h2>
        <div className={styles.grid}>
          <ProductGrid products={products} studioSlug={studioSlug} />
        </div>
      </div>
    </main>
  );
}

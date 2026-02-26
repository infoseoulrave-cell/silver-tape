import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductGrid from '@/components/product/ProductGrid';
import CategoryMasonry from '@/components/home/CategoryMasonry';
import { getStudioBySlug, STUDIOS } from '@/data/studios';
import { getProductsByStudio, getProductsByStudioAndCategory } from '@/data/products';
import { CATEGORIES } from '@/data/categories';
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
  const featured = products.filter(p => p.featured);

  // Get categories that have products in this studio
  const studioCategories = CATEGORIES.filter(cat =>
    getProductsByStudioAndCategory(studioSlug, cat.id).length > 0
  );

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
            <span className={styles.heroDot} />
            <span>{studioCategories.length} 컬렉션</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      {studioCategories.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>COLLECTIONS</h2>
          <CategoryMasonry studioSlug={studioSlug} categories={studioCategories} />
        </div>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>FEATURED</h2>
          <div className={styles.grid}>
            <ProductGrid products={featured} studioSlug={studioSlug} />
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

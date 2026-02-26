import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductGrid from '@/components/product/ProductGrid';
import { getProductsByStudioAndCategory, getProductsByStudio } from '@/data/products';
import { CATEGORIES, getCategoryById } from '@/data/categories';
import { getStudioBySlug, STUDIOS } from '@/data/studios';
import styles from './category.module.css';

interface StudioCategoryPageProps {
  params: Promise<{ studioSlug: string; category: string }>;
}

export async function generateStaticParams() {
  const params: { studioSlug: string; category: string }[] = [];
  for (const studio of STUDIOS) {
    const studioProducts = getProductsByStudio(studio.slug);
    const usedCategories = new Set(studioProducts.map(p => p.category));
    for (const catId of usedCategories) {
      params.push({ studioSlug: studio.slug, category: catId });
    }
  }
  return params;
}

export async function generateMetadata({ params }: StudioCategoryPageProps): Promise<Metadata> {
  const { studioSlug, category: catId } = await params;
  const studio = getStudioBySlug(studioSlug);
  const cat = getCategoryById(catId);
  if (!studio || !cat) return { title: 'Not Found' };

  return {
    title: `${cat.name} — ${studio.name}`,
    description: `${studio.name}의 ${cat.nameKo} 컬렉션`,
  };
}

export default async function StudioCategoryPage({ params }: StudioCategoryPageProps) {
  const { studioSlug, category: catId } = await params;
  const studio = getStudioBySlug(studioSlug);
  if (!studio) notFound();

  const category = getCategoryById(catId);
  if (!category) notFound();

  const products = getProductsByStudioAndCategory(studioSlug, category.id);
  if (products.length === 0) notFound();

  return (
    <main>
      <Breadcrumb items={[
        { label: '홈', href: '/' },
        { label: studio.name, href: `/studio/${studioSlug}` },
        { label: category.nameKo },
      ]} />

      {/* Category Hero */}
      <div className={styles.hero}>
        <Image
          src={category.coverImage}
          alt={category.name}
          fill
          className={styles.heroImage}
          priority
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{category.name}</h1>
          <p className={styles.heroTitleKo}>{category.nameKo}</p>
          <p className={styles.heroDesc}>{category.description}</p>
          <p className={styles.heroCount}>{products.length} 작품</p>
        </div>
      </div>

      <div className={styles.container}>
        <ProductGrid products={products} studioSlug={studioSlug} />
      </div>
    </main>
  );
}

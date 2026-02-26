import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductGrid from '@/components/product/ProductGrid';
import { getProductsByCategory } from '@/data/products';
import { CATEGORIES, getCategoryById } from '@/data/categories';
import styles from './category.module.css';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map(c => ({ category: c.id }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: catId } = await params;
  const cat = getCategoryById(catId);
  if (!cat) return { title: 'Category Not Found' };

  return {
    title: `${cat.name} — ${cat.nameKo}`,
    description: cat.descriptionKo,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: catId } = await params;
  const category = getCategoryById(catId);
  if (!category) notFound();

  const products = getProductsByCategory(category.id);

  return (
    <main>
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: category.nameKo }]} />

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

      {/* Product Grid */}
      <div className={styles.container}>
        <ProductGrid products={products} />
      </div>
    </main>
  );
}

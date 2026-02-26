import type { Metadata } from 'next';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductGrid from '@/components/product/ProductGrid';
import { PRODUCTS } from '@/data/products';
import styles from './products.module.css';

export const metadata: Metadata = {
  title: 'All Products',
  description: 'HANGOVER 전체 작품 컬렉션. AI가 만든 프리미엄 그래픽 아트 포스터.',
};

export default function ProductsPage() {
  return (
    <main>
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '전체 작품' }]} />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>ALL PRODUCTS</h1>
          <p className={styles.subtitle}>전체 작품 {PRODUCTS.length}점</p>
        </div>
        <ProductGrid products={PRODUCTS} />
      </div>
    </main>
  );
}

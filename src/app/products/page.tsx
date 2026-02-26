import type { Metadata } from 'next';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductGrid from '@/components/product/ProductGrid';
import { PRODUCTS } from '@/data/products';
import styles from './products.module.css';

export const metadata: Metadata = {
  title: '전체 작품 — SILVERTAPE',
  description: 'SILVERTAPE의 모든 작품을 한 곳에서 확인하세요.',
};

export default function ProductsPage() {
  return (
    <main>
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '전체 작품' }]} />

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>All Works</h1>
          <p className={styles.subtitle}>모든 작품을 한 곳에서 감상하세요.</p>
        </div>

        <ProductGrid products={PRODUCTS} />
      </div>
    </main>
  );
}

import type { Product } from '@/types/product';
import { PRODUCTS } from '@/data/products';
import ProductCard from './ProductCard';
import styles from './ProductDetail.module.css';

interface RelatedProductsProps {
  currentProduct: Product;
}

export default function RelatedProducts({ currentProduct }: RelatedProductsProps) {
  const related = PRODUCTS
    .filter(p => p.id !== currentProduct.id)
    .filter(p => p.category === currentProduct.category)
    .slice(0, 4);

  // If not enough from same category, fill with other products
  if (related.length < 4) {
    const others = PRODUCTS
      .filter(p => p.id !== currentProduct.id && p.category !== currentProduct.category)
      .slice(0, 4 - related.length);
    related.push(...others);
  }

  return (
    <div className={styles.related}>
      <div className={styles.relatedHeader}>
        <div className={styles.relatedTag}>You May Also Like</div>
        <h2 className={styles.relatedTitle}>함께 취해볼 작품들</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--ho-space-lg)' }}>
        {related.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

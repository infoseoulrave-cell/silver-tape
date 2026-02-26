import type { Product } from '@/types/product';
import { getProductsByStudio } from '@/data/products';
import ProductCard from './ProductCard';
import styles from './ProductDetail.module.css';

interface RelatedProductsProps {
  currentProduct: Product;
  studioSlug?: string;
}

export default function RelatedProducts({ currentProduct, studioSlug }: RelatedProductsProps) {
  const slug = studioSlug ?? currentProduct.studioSlug;
  const studioProducts = getProductsByStudio(slug);

  const related = studioProducts
    .filter(p => p.id !== currentProduct.id)
    .filter(p => p.category === currentProduct.category)
    .slice(0, 4);

  // If not enough from same category, fill with other products from same studio
  if (related.length < 4) {
    const others = studioProducts
      .filter(p => p.id !== currentProduct.id && p.category !== currentProduct.category)
      .slice(0, 4 - related.length);
    related.push(...others);
  }

  return (
    <div className={styles.related}>
      <div className={styles.relatedHeader}>
        <div className={styles.relatedTag}>You May Also Like</div>
        <h2 className={styles.relatedTitle}>함께 감상할 작품들</h2>
      </div>
      <div className={styles.relatedGrid}>
        {related.map(product => (
          <ProductCard key={product.id} product={product} studioSlug={slug} />
        ))}
      </div>
    </div>
  );
}

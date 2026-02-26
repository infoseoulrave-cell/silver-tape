import type { Product } from '@/types/product';
import ProductCard from './ProductCard';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  products: Product[];
  studioSlug?: string;
}

export default function ProductGrid({ products, studioSlug }: ProductGridProps) {
  return (
    <div className={styles.grid}>
      {products.map(product => (
        <ProductCard key={product.id} product={product} studioSlug={studioSlug} />
      ))}
    </div>
  );
}

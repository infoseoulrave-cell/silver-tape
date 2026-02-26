import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types/product';
import { SIZE_OPTIONS } from '@/data/pricing';
import { formatKRW } from '@/lib/format';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const basePrice = SIZE_OPTIONS[0].printPrice + SIZE_OPTIONS[0].frameAddon;

  return (
    <Link href={`/products/${product.slug}`} className={styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={product.image}
          alt={`${product.title} — HANGOVER 포스터`}
          width={600}
          height={800}
          className={styles.image}
        />
        {product.featured && <span className={styles.badge}>Exclusive</span>}
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{product.title}</h3>
        <p className={styles.category}>{product.category}</p>
        <p className={styles.price}>{formatKRW(basePrice)}</p>
      </div>
    </Link>
  );
}

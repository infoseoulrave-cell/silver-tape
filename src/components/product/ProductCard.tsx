import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types/product';
import { SIZE_OPTIONS } from '@/data/pricing';
import { formatKRW } from '@/lib/format';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  studioSlug?: string;
}

export default function ProductCard({ product, studioSlug }: ProductCardProps) {
  const basePrice = SIZE_OPTIONS[0].printPrice + SIZE_OPTIONS[0].frameAddon;
  const slug = studioSlug ?? product.studioSlug;

  return (
    <Link href={`/studio/${slug}/${product.slug}`} className={styles.card} prefetch={false}>
      <div className={styles.imageWrap}>
        <Image
          src={product.image}
          alt={`${product.title} — ${product.artist}`}
          width={600}
          height={800}
          className={styles.image}
        />
        {product.featured && <span className={styles.badge}>Exclusive</span>}
      </div>
      <div className={styles.info}>
        <p className={styles.studio}>{product.artist.replace(/ AI$/, '')}</p>
        <h3 className={styles.name}>{product.title}</h3>
        <p className={styles.price}>{formatKRW(basePrice)}</p>
      </div>
    </Link>
  );
}

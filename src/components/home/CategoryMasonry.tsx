import Image from 'next/image';
import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';
import { getProductsByCategory, getProductsByStudioAndCategory } from '@/data/products';
import type { Category } from '@/types/product';
import styles from './CategoryMasonry.module.css';

const GRID_CLASS_MAP: Record<string, string> = {
  fine: styles.fine,
  blk: styles.blk,
  fun: styles.fun,
  pop: styles.pop,
  art: styles.art,
  witty: styles.witty,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  fine: '대담한 붓질, 원초적 감정',
  blk: '그림자 속 크롬 드림',
  fun: '미소 짓게 만드는 초현실',
  pop: '시끄럽고, 그래픽하고, 당당하게',
  art: '기술과 상상의 만남',
  witty: '두 번 생각하고, 한 번 미소 짓다',
};

interface CategoryMasonryProps {
  studioSlug?: string;
  categories?: Category[];
}

export default function CategoryMasonry({ studioSlug, categories }: CategoryMasonryProps) {
  const cats = categories ?? CATEGORIES;

  return (
    <section className={styles.section}>
      {!studioSlug && (
        <div className={styles.header}>
          <div className={styles.tag}>Collections</div>
          <h2 className={styles.title}>Collections</h2>
          <p className={styles.sub}>취향대로 골라, 벽에 걸어.</p>
        </div>
      )}

      <div className={styles.grid}>
        {cats.map(cat => {
          const studioProducts = studioSlug
            ? getProductsByStudioAndCategory(studioSlug, cat.id)
            : null;
          const count = studioProducts
            ? studioProducts.length
            : getProductsByCategory(cat.id).length;
          const href = studioSlug
            ? `/studio/${studioSlug}/category/${cat.id}`
            : `/category/${cat.id}`;
          // Use first product image from this studio's category, fallback to global cover
          const coverImage = studioProducts && studioProducts.length > 0
            ? studioProducts[0].artImage
            : cat.coverImage;
          return (
            <Link
              key={cat.id}
              href={href}
              className={`${styles.card} ${GRID_CLASS_MAP[cat.id] || ''}`}
            >
              <Image
                src={coverImage}
                alt={`${cat.name} collection`}
                fill
                sizes="(max-width: 767px) 260px, (max-width: 1023px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
              />
              <div className={styles.overlay}>
                <div className={styles.catName}>{cat.name}</div>
                <div className={styles.catCount}>{count} 작품</div>
                <div className={styles.catDesc}>
                  {CATEGORY_DESCRIPTIONS[cat.id]}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

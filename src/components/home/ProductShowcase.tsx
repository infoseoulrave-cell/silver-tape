import Image from 'next/image';
import Link from 'next/link';
import { getWeeklyPicks } from '@/data/products';
import { SIZE_OPTIONS } from '@/data/pricing';
import { formatPrice } from '@/lib/format';
import styles from './ProductShowcase.module.css';

export default function ProductShowcase() {
  const picks = getWeeklyPicks();
  const heroProduct = picks[0];
  const gridProducts = picks.slice(1, 4);
  const basePrice = SIZE_OPTIONS[0].printPrice;

  return (
    <section className={styles.showcase}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.tag}>Top Shelf</div>
          <h2 className={styles.title}>This Week&apos;s High</h2>
          <p className={styles.sub}>이번 주, 클릭이 가장 많은 기대작들</p>
        </div>

        {heroProduct && (
          <Link href={`/studio/${heroProduct.studioSlug}/${heroProduct.slug}`} className={styles.featuredSplit}>
            <div className={styles.featuredImg}>
              <Image
                src={heroProduct.image}
                alt={heroProduct.title}
                width={720}
                height={560}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                priority
              />
            </div>
            <div className={styles.featuredPanel}>
              <span className={styles.badge}>Top Shelf</span>
              <div className={styles.featuredCategory}>{heroProduct.category}</div>
              <h3 className={styles.featuredTitle}>{heroProduct.title}</h3>
              <p className={styles.featuredArtist}>by {heroProduct.artist}</p>
              <div className={styles.featuredPrice}>
                <span className={styles.won}>{'\u20A9'}</span>
                {formatPrice(basePrice)}
              </div>
            </div>
          </Link>
        )}

        <div className={styles.grid3}>
          {gridProducts.map((product, i) => (
            <Link key={product.id} href={`/studio/${product.studioSlug}/${product.slug}`} className={styles.card}>
              <div className={styles.cardImgWrap}>
                {i === 0 && (
                  <div className={styles.cardBadges}>
                    <span className={styles.badgeGold}>Most Clicked</span>
                  </div>
                )}
                {i === 1 && (
                  <div className={styles.cardBadges}>
                    <span className={styles.badgeBlue}>Trending</span>
                  </div>
                )}
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  sizes="(max-width: 767px) 50vw, 33vw"
                  className={styles.cardImg}
                />
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardCat}>{product.category}</div>
                <div className={styles.cardName}>{product.title}</div>
                <div className={styles.cardArtist}>by {product.artist}</div>
                <div className={styles.cardPrice}>
                  {'\u20A9'}{formatPrice(basePrice)}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className={styles.viewAll}>
          <Link href="/products" className={styles.btnDark}>
            전체 메뉴 보기 &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { getFeaturedProducts } from '@/data/products';
import { SIZE_OPTIONS } from '@/data/pricing';
import { formatPrice } from '@/lib/format';
import styles from './ProductShowcase.module.css';

export default function ProductShowcase() {
  const featured = getFeaturedProducts();
  const heroProduct = featured[0];
  const gridProducts = featured.slice(1, 4);
  const basePrice = SIZE_OPTIONS[0].printPrice;

  return (
    <section className={styles.showcase}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.tag}>Fresh Pour</div>
          <h2 className={styles.title}>This Week&apos;s High</h2>
          <p className={styles.sub}>이번 주, 가장 취하게 만드는 신작들</p>
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
              <span className={styles.badge}>Fresh Pour</span>
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
                    <span className={styles.badgeGold}>Last Call</span>
                  </div>
                )}
                {i === 1 && (
                  <div className={styles.cardBadges}>
                    <span className={styles.badgeBlue}>Best</span>
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

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import type { Product, PrintVersion } from '@/types/product';
import type { FrameColor } from '@/types/product';
import { SIZE_OPTIONS, FRAME_OPTIONS, calculatePrice } from '@/data/pricing';
import { formatKRW } from '@/lib/format';
import { useCartStore } from '@/lib/cart-store';
import { trackViewContent, trackAddToCart } from '@/lib/meta-pixel-events';
import RainbowCelebration from '@/components/ui/RainbowCelebration';
import styles from './ProductDetail.module.css';

interface ProductDetailClientProps {
  product: Product;
}

const FRAME_CLASS_MAP: Record<FrameColor, string> = {
  black: styles.frameBlack,
  white: styles.frameWhite,
  walnut: styles.frameWalnut,
  none: styles.frameNone,
};

const MINI_FRAME_CLASS_MAP: Record<string, string> = {
  black: styles.miniBlack,
  white: styles.miniWhite,
  walnut: styles.miniWalnut,
  print: styles.miniPrint,
};

const FRAME_NAMES: Record<FrameColor, string> = {
  black: 'Black',
  white: 'White',
  walnut: 'Walnut',
  none: 'Print Only',
};


interface ThumbConfig {
  frame: FrameColor;
  miniFrame: string;
  artVariant: number;
  label: string;
}

const THUMB_CONFIGS: ThumbConfig[] = [
  { frame: 'black', miniFrame: 'black', artVariant: 0, label: 'Black' },
  { frame: 'white', miniFrame: 'white', artVariant: 0, label: 'White' },
  { frame: 'walnut', miniFrame: 'walnut', artVariant: 1, label: 'Walnut' },
  { frame: 'none', miniFrame: 'print', artVariant: 0, label: 'Print Only' },
];

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [currentFrame, setCurrentFrame] = useState<FrameColor>('black');
  const [currentSize, setCurrentSize] = useState(SIZE_OPTIONS[0].id);
  const [quantity, setQuantity] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [wished, setWished] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Set<number>>(new Set([0]));
  const [printVersion, setPrintVersion] = useState<PrintVersion>(product.hasPosterVersion ? 'poster' : 'art-only');
  const [posterVariantId, setPosterVariantId] = useState(product.posterVariants?.[0]?.id ?? '');
  const [celebrating, setCelebrating] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  // ViewContent 이벤트 (상품 페이지 진입 시 1회)
  useEffect(() => {
    const { total: initTotal } = calculatePrice(SIZE_OPTIONS[0].id, true);
    trackViewContent({
      contentId: product.id,
      contentName: product.title,
      contentCategory: product.category,
      value: initTotal,
    });
  }, [product.id, product.title, product.category]);

  const hasFrame = currentFrame !== 'none';
  const { total, printPrice, frameAddon } = calculatePrice(currentSize, hasFrame);
  const originalPrice = Math.ceil(total * 1.3 / 1000) * 1000;
  const discountPct = Math.round((1 - total / originalPrice) * 100);

  const posterVariants = product.posterVariants ?? [];
  const currentPosterVariant = posterVariants.find(v => v.id === posterVariantId) ?? posterVariants[0];
  const posterImage = currentPosterVariant?.image ?? product.posterImage ?? product.image;
  const currentImage = printVersion === 'art-only' ? product.artImage : posterImage;
  const sizeObj = SIZE_OPTIONS.find(s => s.id === currentSize) ?? SIZE_OPTIONS[0];
  const posterLabel = currentPosterVariant?.nameKo ?? currentPosterVariant?.name;
  const artworkBgLabel = printVersion === 'poster'
    ? (posterLabel ? `포스터 · ${posterLabel}` : '포스터 프린트')
    : '아트 프린트';

  const handleThumbClick = useCallback((index: number) => {
    const config = THUMB_CONFIGS[index];
    setActiveThumb(index);
    setCurrentFrame(config.frame);
  }, []);

  const handleFrameChange = useCallback((frame: FrameColor) => {
    setCurrentFrame(frame);
    const thumbIdx = THUMB_CONFIGS.findIndex(t => t.frame === frame);
    if (thumbIdx >= 0) setActiveThumb(thumbIdx);
  }, []);

  const addItem = useCartStore(s => s.addItem);

  const handleAddToCart = useCallback(() => {
    addItem({
      productId: product.id,
      productTitle: product.title,
      productImage: currentImage,
      studioId: product.studioId,
      studioName: product.artist,
      studioSlug: product.studioSlug,
      size: currentSize,
      frame: currentFrame,
      artworkBg: artworkBgLabel,
      quantity,
      printPrice: sizeObj.printPrice,
      framePrice: hasFrame ? sizeObj.frameAddon : 0,
    });
    trackAddToCart({
      contentId: product.id,
      contentName: product.title,
      value: total * quantity,
    });
    setAddedFeedback(true);
    setCelebrating(true);
    setTimeout(() => setAddedFeedback(false), 2000);
    setTimeout(() => setCelebrating(false), 1500);
  }, [addItem, product, currentImage, currentSize, currentFrame, quantity, sizeObj, hasFrame, total, artworkBgLabel]);

  const toggleAccordion = useCallback((index: number) => {
    setOpenAccordions(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return (
    <>
      <div className={styles.product}>
        {/* ─── Gallery (Left) ─── */}
        <div className={styles.gallery}>
          <div className={styles.galleryMain}>
            <div
              className={styles.frameAssembly}
              onClick={() => setLightboxOpen(true)}
              role="button"
              tabIndex={0}
              aria-label="이미지 확대"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setLightboxOpen(true); }}
              style={{ cursor: 'pointer' }}
            >
              <div className={`${styles.frameOuter} ${FRAME_CLASS_MAP[currentFrame]}`}>
                <div className={styles.innerLip}>
                  <Image
                    src={currentImage}
                    alt={`${product.title} — ${product.artist}`}
                    width={760}
                    height={1000}
                    className={styles.artworkImg}
                    priority
                  />
                </div>
              </div>
            </div>
            <div className={styles.galleryBadge}>EXCLUSIVE</div>
          </div>

          {/* Thumbnails */}
          <div className={styles.thumbs}>
            {THUMB_CONFIGS.map((config, i) => (
              <div
                key={config.label}
                className={`${styles.thumb} ${activeThumb === i ? styles.thumbActive : ''}`}
                onClick={() => handleThumbClick(i)}
                role="button"
                tabIndex={0}
                aria-label={`${config.label} 프레임 미리보기`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleThumbClick(i); }}
              >
                <div className={styles.miniFrame}>
                  <div className={`${styles.miniFrameBox} ${MINI_FRAME_CLASS_MAP[config.miniFrame]}`}>
                    <Image
                      src={product.image}
                      alt=""
                      width={120}
                      height={160}
                    />
                  </div>
                </div>
                <div className={styles.thumbLabel}>{config.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Product Info (Right) ─── */}
        <div className={styles.info}>
          <div className={styles.infoTag}>{product.id.toUpperCase()} / Exclusive</div>
          <h1 className={styles.infoTitle}>{product.title}</h1>
          <p className={styles.infoSeries}>
            <strong>{product.category.toUpperCase()} 시리즈</strong> — {product.titleKo} / 한정판
          </p>

          {/* Price */}
          <div className={styles.priceRow} aria-live="polite">
            <span className={styles.price}>{formatKRW(total)}</span>
            <div className={styles.priceMeta}>
              <div className={styles.priceMetaTop}>
                <span className={styles.priceDiscount}>{discountPct}% OFF</span>
                <span className={styles.priceOriginal}>{formatKRW(originalPrice)}</span>
              </div>
              <div className={styles.priceBreakdown}>
                {hasFrame
                  ? `프린트 ${formatKRW(printPrice)} + 프레임 ${formatKRW(frameAddon)}`
                  : '프린트 단품'}
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className={styles.shippingNote}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
              <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/>
              <circle cx="7" cy="18" r="2"/>
              <circle cx="17" cy="18" r="2"/>
            </svg>
            5만원 이상 무료배송 · 제작 후 2-4일 이내 출고
          </div>

          {/* Print Version Selector */}
          {product.hasPosterVersion && (
            <div className={styles.optionGroup}>
              <div className={styles.optionLabel}>
                프린트 버전 <span className={styles.optionSelected}>— {printVersion === 'poster' ? '포스터 프린트' : '아트 프린트'}</span>
              </div>
              <div className={styles.printVersionOptions}>
                <button
                  className={`${styles.printVersionBtn} ${printVersion === 'poster' ? styles.printVersionBtnActive : ''}`}
                  onClick={() => setPrintVersion('poster')}
                  aria-pressed={printVersion === 'poster'}
                >
                  <div className={styles.printVersionIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="2" width="20" height="20" rx="1" />
                      <rect x="4" y="4" width="16" height="12" rx="0.5" />
                      <line x1="4" y1="18" x2="12" y2="18" />
                      <line x1="4" y1="20" x2="8" y2="20" />
                    </svg>
                  </div>
                  <div className={styles.printVersionName}>포스터 프린트</div>
                  <div className={styles.printVersionDesc}>텍스트 + 매트보드 + 작품</div>
                </button>
                <button
                  className={`${styles.printVersionBtn} ${printVersion === 'art-only' ? styles.printVersionBtnActive : ''}`}
                  onClick={() => setPrintVersion('art-only')}
                  aria-pressed={printVersion === 'art-only'}
                >
                  <div className={styles.printVersionIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="1" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                  <div className={styles.printVersionName}>아트 프린트</div>
                  <div className={styles.printVersionDesc}>이미지만 (프레임 전용)</div>
                </button>
              </div>

              {printVersion === 'poster' && posterVariants.length > 0 && (
                <div className={styles.posterVariants}>
                  <div className={styles.posterVariantsLabel}>매트 옵션</div>
                  <div className={styles.posterVariantSwatches}>
                    {posterVariants.map(variant => (
                      <button
                        key={variant.id}
                        type="button"
                        className={`${styles.posterVariantBtn} ${variant.id === currentPosterVariant?.id ? styles.posterVariantBtnActive : ''}`}
                        onClick={() => setPosterVariantId(variant.id)}
                        aria-pressed={variant.id === currentPosterVariant?.id}
                      >
                        {variant.nameKo ?? variant.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}


          {/* Size Selector */}
          <div className={styles.optionGroup}>
            <div className={styles.optionLabel}>
              사이즈 <span className={styles.optionSelected}>— {sizeObj.label}</span>
            </div>
            <div className={styles.sizeOptions}>
              {SIZE_OPTIONS.map(size => {
                const sizeTotal = hasFrame ? size.printPrice + size.frameAddon : size.printPrice;
                return (
                  <button
                    key={size.id}
                    className={`${styles.sizeBtn} ${currentSize === size.id ? styles.sizeBtnActive : ''}`}
                    onClick={() => setCurrentSize(size.id)}
                    aria-pressed={currentSize === size.id}
                  >
                    <div className={styles.sizeName}>{size.label}</div>
                    <div className={styles.sizeDim}>{size.dimensions}</div>
                    <div className={styles.sizePrice}>{formatKRW(sizeTotal)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frame Selector */}
          <div className={`${styles.optionGroup} ${styles.optionGroupBordered}`}>
            <div className={styles.optionLabel}>
              프레임 <span className={styles.optionSelected}>— {FRAME_NAMES[currentFrame]}</span>
            </div>
            <div className={styles.frameSwatches}>
              {FRAME_OPTIONS.map(frame => (
                <div
                  key={frame.id}
                  className={`${styles.frameSwatch} ${currentFrame === frame.id ? styles.frameSwatchActive : ''}`}
                  onClick={() => handleFrameChange(frame.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${frame.nameKo} 프레임`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFrameChange(frame.id); }}
                >
                  <div className={styles.swatchColor} style={{ background: frame.swatchGradient }} />
                  <span className={styles.swatchLabel}>{frame.nameKo}</span>
                </div>
              ))}
            </div>
            <div className={`${styles.framePriceNote} ${!hasFrame ? styles.hidden : ''}`}>
              + {formatKRW(sizeObj.frameAddon)} (프레임 포함가)
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <div className={styles.qty}>
              <button
                className={styles.qtyBtn}
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                aria-label="수량 감소"
              >
                −
              </button>
              <input
                type="text"
                className={styles.qtyVal}
                value={quantity}
                readOnly
                aria-label="수량"
              />
              <button
                className={styles.qtyBtn}
                onClick={() => setQuantity(q => Math.min(10, q + 1))}
                aria-label="수량 증가"
              >
                +
              </button>
            </div>
            <button
              ref={addBtnRef}
              className={`${styles.addBtn} ${addedFeedback ? styles.addBtnFeedback : ''}`}
              onClick={handleAddToCart}
            >
              {addedFeedback ? '컬렉션에 담았습니다!' : '컬렉션에 담기'}
            </button>
            <RainbowCelebration active={celebrating} originRef={addBtnRef} />
            <button
              className={`${styles.wishlistBtn} ${wished ? styles.wishlistActive : ''}`}
              onClick={() => setWished(w => !w)}
              title="위시리스트"
              aria-label="위시리스트"
            >
              {wished ? '\u2665' : '\u2661'}
            </button>
          </div>

          {/* Trust Badges */}
          <div className={styles.trust}>
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className={styles.trustText}>큐레이션 프리미엄 아트</div>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <div className={styles.trustText}>안전한 보호 포장</div>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
                  <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/>
                  <circle cx="7" cy="18" r="2"/>
                  <circle cx="17" cy="18" r="2"/>
                </svg>
              </div>
              <div className={styles.trustText}>7일 이내 발송</div>
            </div>
          </div>

          {/* Accordions */}
          <div className={styles.accordions}>
            {/* 작품 설명 */}
            <div className={styles.accordion}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleAccordion(0)}
                aria-expanded={openAccordions.has(0)}
              >
                작품 설명
                <span className={`${styles.accordionIcon} ${openAccordions.has(0) ? styles.accordionIconOpen : ''}`}>+</span>
              </button>
              <div className={`${styles.accordionBody} ${openAccordions.has(0) ? styles.accordionBodyOpen : ''}`}>
                <p>{product.descriptionKo}</p>
              </div>
            </div>

            {/* 프린트 사양 */}
            <div className={styles.accordion}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleAccordion(1)}
                aria-expanded={openAccordions.has(1)}
              >
                프린트 사양
                <span className={`${styles.accordionIcon} ${openAccordions.has(1) ? styles.accordionIconOpen : ''}`}>+</span>
              </button>
              <div className={`${styles.accordionBody} ${openAccordions.has(1) ? styles.accordionBodyOpen : ''}`}>
                <table className={styles.specTable}>
                  <tbody>
                    <tr><td>용지</td><td>프리미엄 아트지 220gsm, 매트 피니시</td></tr>
                    <tr><td>인쇄</td><td>12색 지클레 프린트, 아카이벌 잉크</td></tr>
                    <tr><td>내구성</td><td>100년+ 색상 보존 (아카이벌 등급)</td></tr>
                    <tr><td>제작</td><td>디지털 원본 + 전문 보정</td></tr>
                    <tr><td>해상도</td><td>300 DPI 이상</td></tr>
                    <tr><td>에디션</td><td>한정판 {product.editionSize}부</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 프레임 & 매트 상세 */}
            <div className={styles.accordion}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleAccordion(2)}
                aria-expanded={openAccordions.has(2)}
              >
                프레임 & 매트 상세
                <span className={`${styles.accordionIcon} ${openAccordions.has(2) ? styles.accordionIconOpen : ''}`}>+</span>
              </button>
              <div className={`${styles.accordionBody} ${openAccordions.has(2) ? styles.accordionBodyOpen : ''}`}>
                <ul>
                  <li>블랙: 알루미늄 소재, 슬림 20mm 프로파일, 무광</li>
                  <li>화이트: 알루미늄 소재, 슬림 20mm, 아이보리 화이트</li>
                  <li>오크: 천연 참나무 원목, 24mm 프로파일, 내추럴 마감</li>
                  <li>월넛: 천연 호두나무 원목, 24mm, 다크 브라운 마감</li>
                  <li>매트: 1.4mm 두께 보존용 매트보드, 산성분 프리</li>
                  <li>글레이징: UV 차단 아크릴 (99% UV 차단)</li>
                  <li>뒷판: MDF 보드 + 벽걸이 하드웨어 포함</li>
                </ul>
              </div>
            </div>

            {/* 배송 & 교환 */}
            <div className={styles.accordion}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleAccordion(3)}
                aria-expanded={openAccordions.has(3)}
              >
                배송 & 교환
                <span className={`${styles.accordionIcon} ${openAccordions.has(3) ? styles.accordionIconOpen : ''}`}>+</span>
              </button>
              <div className={`${styles.accordionBody} ${openAccordions.has(3) ? styles.accordionBodyOpen : ''}`}>
                <ul>
                  <li>주문 후 제작: 영업일 기준 2-4일 소요</li>
                  <li>프린트만: 하드 튜브 포장, 택배 발송</li>
                  <li>프레임 포함: 에어캡 + 전용 박스 포장</li>
                  <li>5만원 이상 무료배송 (도서산간 추가비 발생)</li>
                  <li>수령 후 7일 이내 교환/환불 가능 (단순변심 포함)</li>
                  <li>제품 하자 시 무료 재발송</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Story Section ─── */}
      <div className={styles.story}>
        <div className={styles.storyVisual}>
          <Image
            src={product.artImage}
            alt={`${product.title} 상세 이미지`}
            width={600}
            height={800}
          />
        </div>
        <div>
          <div className={styles.storyTag}>Behind the Art</div>
          <h2 className={styles.storyTitle}>{product.titleKo}의<br />이야기</h2>
          <p className={styles.storyText}>{product.description}</p>
          <blockquote className={styles.storyQuote}>
            &ldquo;{product.tagline ? product.tagline.split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            )) : <>좋은 포스터는 숙취처럼 남는다.<br />걸어라. 취해라. 매일매일.</>}&rdquo;
          </blockquote>
        </div>
      </div>

      {/* ─── Lightbox ─── */}
      {lightboxOpen && (
        <div
          className={styles.lightbox}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false);
          }}
          role="dialog"
          aria-label="이미지 확대 보기"
        >
          <button
            className={styles.lightboxClose}
            onClick={() => setLightboxOpen(false)}
            aria-label="닫기"
          >
            &times;
          </button>
          <Image
            src={currentImage}
            alt={`${product.title} 확대`}
            width={1200}
            height={1600}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', width: 'auto', height: 'auto' }}
          />
        </div>
      )}
    </>
  );
}

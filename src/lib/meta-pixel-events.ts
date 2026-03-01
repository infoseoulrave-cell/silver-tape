/**
 * Meta Pixel 클라이언트 이벤트 헬퍼
 *
 * fbq()를 안전하게 호출합니다.
 * MetaPixel 컴포넌트가 로드한 fbevents.js가 window.fbq를 생성합니다.
 */

type FbqFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: FbqFn;
  }
}

function fbq(...args: unknown[]) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args);
  }
}

/** 상품 상세 페이지 조회 */
export function trackViewContent(params: {
  contentId: string;
  contentName: string;
  contentCategory: string;
  value: number;
  currency?: string;
}) {
  fbq('track', 'ViewContent', {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_category: params.contentCategory,
    content_type: 'product',
    value: params.value,
    currency: params.currency ?? 'KRW',
  });
}

/** 장바구니 추가 */
export function trackAddToCart(params: {
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
}) {
  fbq('track', 'AddToCart', {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_type: 'product',
    value: params.value,
    currency: params.currency ?? 'KRW',
  });
}

/** 결제 시작 */
export function trackInitiateCheckout(params: {
  numItems: number;
  value: number;
  currency?: string;
}) {
  fbq('track', 'InitiateCheckout', {
    num_items: params.numItems,
    value: params.value,
    currency: params.currency ?? 'KRW',
  });
}

/** 구매 완료 — 서버 CAPI와 event_id=purchase_{orderId}로 중복 제거 */
export function trackPurchase(params: {
  orderId: string;
  value: number;
  numItems?: number;
  contentIds?: string[];
  currency?: string;
}) {
  fbq('track', 'Purchase', {
    content_ids: params.contentIds ?? [],
    content_type: 'product',
    value: params.value,
    currency: params.currency ?? 'KRW',
    num_items: params.numItems ?? 1,
    order_id: params.orderId,
  });
}

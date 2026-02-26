/**
 * Meta Conversion API (서버사이드)
 *
 * 결제 완료 등 서버에서 발생하는 이벤트를 Meta에 전송합니다.
 * 클라이언트 Meta Pixel과 함께 사용하면 이벤트 중복 제거(deduplication)가 적용됩니다.
 *
 * 환경변수:
 *   META_PIXEL_ID       — 픽셀(데이터 세트) ID
 *   META_ACCESS_TOKEN   — 전환 API 액세스 토큰
 */

import { createHash } from 'crypto';

const PIXEL_ID = process.env.META_PIXEL_ID ?? process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN ?? '';
const API_VERSION = 'v25.0';
const ENDPOINT = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export function isMetaConfigured(): boolean {
  return PIXEL_ID.length > 0 && ACCESS_TOKEN.length > 0;
}

interface UserData {
  email?: string;
  phone?: string;
  name?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
}

interface PurchaseData {
  orderId: string;
  totalAmount: number;
  currency?: string;
  items?: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
  }>;
}

function buildUserData(user: UserData) {
  const data: Record<string, unknown> = {};

  if (user.email) data.em = [sha256(user.email)];
  if (user.phone) data.ph = [sha256(user.phone.replace(/[^0-9]/g, ''))];
  if (user.name) {
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      data.fn = [sha256(parts[0])];
      data.ln = [sha256(parts.slice(1).join(' '))];
    } else {
      data.fn = [sha256(parts[0])];
    }
  }
  if (user.clientIpAddress) data.client_ip_address = user.clientIpAddress;
  if (user.clientUserAgent) data.client_user_agent = user.clientUserAgent;
  if (user.fbc) data.fbc = user.fbc;
  if (user.fbp) data.fbp = user.fbp;

  return data;
}

/** Purchase 이벤트 전송 (결제 완료 시) */
export async function sendPurchaseEvent(
  purchase: PurchaseData,
  user: UserData,
  eventId?: string,
): Promise<boolean> {
  if (!isMetaConfigured()) return false;

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId ?? `purchase_${purchase.orderId}`,
        event_source_url: 'https://silvertape.art/checkout/success',
        action_source: 'website',
        user_data: buildUserData(user),
        custom_data: {
          currency: purchase.currency ?? 'KRW',
          value: purchase.totalAmount,
          order_id: purchase.orderId,
          content_type: 'product',
          contents: purchase.items?.map(item => ({
            id: item.id,
            quantity: item.quantity,
            item_price: item.price,
          })),
          num_items: purchase.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 1,
        },
      },
    ],
  };

  try {
    const res = await fetch(`${ENDPOINT}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('[Meta CAPI] Purchase event failed:', err);
      return false;
    }

    console.log(`[Meta CAPI] Purchase event sent: ${purchase.orderId}`);
    return true;
  } catch (err) {
    console.error('[Meta CAPI] Network error:', err);
    return false;
  }
}

/** InitiateCheckout 이벤트 전송 */
export async function sendInitiateCheckoutEvent(
  totalAmount: number,
  numItems: number,
  user: UserData,
  eventId?: string,
): Promise<boolean> {
  if (!isMetaConfigured()) return false;

  const payload = {
    data: [
      {
        event_name: 'InitiateCheckout',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId ?? `checkout_${Date.now()}`,
        event_source_url: 'https://silvertape.art/checkout',
        action_source: 'website',
        user_data: buildUserData(user),
        custom_data: {
          currency: 'KRW',
          value: totalAmount,
          num_items: numItems,
        },
      },
    ],
  };

  try {
    const res = await fetch(`${ENDPOINT}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error('[Meta CAPI] InitiateCheckout failed:', await res.json());
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Meta CAPI] Network error:', err);
    return false;
  }
}

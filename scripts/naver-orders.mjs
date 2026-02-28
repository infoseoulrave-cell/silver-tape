/**
 * 네이버 스마트스토어 주문 조회 스크립트
 * 사용법:
 *   node scripts/naver-orders.mjs              → 최근 24시간 신규 주문
 *   node scripts/naver-orders.mjs 7            → 최근 7일 주문
 *   node scripts/naver-orders.mjs detail       → 최근 24시간 주문 상세
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const envContent = readFileSync(resolve(ROOT, '.env.local'), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const CID = env.NAVER_COMMERCE_APP_ID;
const CS = env.NAVER_COMMERCE_APP_SECRET;
const BASE = 'https://api.commerce.naver.com/external';

async function getToken() {
  const ts = Date.now();
  const hashed = bcrypt.hashSync(`${CID}_${ts}`, CS);
  const sign = Buffer.from(hashed).toString('base64');
  const body = new URLSearchParams({
    client_id: CID, timestamp: String(ts), client_secret_sign: sign,
    grant_type: 'client_credentials', type: 'SELF',
  });
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json();
  if (!data.access_token) {
    console.error('토큰 발급 실패:', data);
    process.exit(1);
  }
  return data.access_token;
}

// 변경 주문 조회 (last-changed-statuses)
async function getChangedOrders(token, fromDate, toDate) {
  const url = `${BASE}/v1/pay-order/seller/product-orders/last-changed-statuses?lastChangedFrom=${encodeURIComponent(fromDate)}&lastChangedTo=${encodeURIComponent(toDate)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('응답 파싱 실패:', text.slice(0, 300));
    return null;
  }
}

// 주문 상세 조회
async function getOrderDetails(token, productOrderIds) {
  const res = await fetch(`${BASE}/v1/pay-order/seller/product-orders/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productOrderIds }),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('상세 조회 실패:', text.slice(0, 300));
    return null;
  }
}

// 날짜 포맷 (ISO 8601 KST with millis)
function formatDate(date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().replace('Z', '+09:00');
}

const token = await getToken();
console.log('토큰 발급 완료\n');

const arg = process.argv[2] || '1';
const days = arg === 'detail' ? 1 : parseInt(arg) || 1;
const showDetail = arg === 'detail';

// 조회 범위 설정 (최대 24시간씩 조회)
const now = new Date();
const fiveSecAgo = new Date(now.getTime() - 5000); // 5초 전 (공식 권장)
const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

console.log(`조회 기간: ${startDate.toLocaleString('ko-KR')} ~ ${fiveSecAgo.toLocaleString('ko-KR')}`);
console.log(`(최근 ${days}일)\n`);

// 24시간 단위로 나눠서 조회
let allOrderIds = [];
let current = new Date(startDate);

while (current < fiveSecAgo) {
  let end = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  if (end > fiveSecAgo) end = fiveSecAgo;

  const data = await getChangedOrders(token, formatDate(current), formatDate(end));

  if (data && data.data && data.data.lastChangeStatuses) {
    const orders = data.data.lastChangeStatuses;
    for (const order of orders) {
      allOrderIds.push(order.productOrderId);
    }
    console.log(`  ${formatDate(current).slice(0, 10)} ~ ${formatDate(end).slice(0, 10)}: ${orders.length}건`);

    // more 페이지가 있으면 추가 조회
    if (data.data.more) {
      let more = data.data.more;
      while (more) {
        const moreParams = new URLSearchParams({
          lastChangedFrom: more.moreFrom || formatDate(current),
          lastChangedTo: formatDate(end),
          moreSequence: String(more.moreSequence || ''),
        });
        const moreData = await getChangedOrders(token,
          more.moreFrom || formatDate(current),
          formatDate(end)
        );
        if (moreData?.data?.lastChangeStatuses) {
          for (const order of moreData.data.lastChangeStatuses) {
            allOrderIds.push(order.productOrderId);
          }
        }
        more = moreData?.data?.more || null;
        await new Promise(r => setTimeout(r, 300));
      }
    }
  } else if (data && data.code) {
    console.log(`  API 에러: ${data.code} - ${data.message || ''}`);
  } else {
    console.log(`  ${formatDate(current).slice(0, 10)}: 주문 없음`);
  }

  current = end;
  await new Promise(r => setTimeout(r, 300));
}

// 중복 제거
allOrderIds = [...new Set(allOrderIds)];

console.log(`\n총 ${allOrderIds.length}건의 주문 변경 감지\n`);

if (allOrderIds.length === 0) {
  console.log('조회된 주문이 없습니다.');
  process.exit(0);
}

// 상세 조회
if (showDetail || allOrderIds.length <= 20) {
  // 300개씩 나눠서 조회
  for (let i = 0; i < allOrderIds.length; i += 300) {
    const batch = allOrderIds.slice(i, i + 300);
    const details = await getOrderDetails(token, batch);

    if (details && details.data) {
      for (const order of details.data) {
        const po = order.productOrder;
        if (!po) continue;
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`  주문번호: ${po.orderId}`);
        console.log(`  상품주문번호: ${po.productOrderId}`);
        console.log(`  상품명: ${po.productName}`);
        console.log(`  수량: ${po.quantity}개`);
        console.log(`  결제금액: ${po.totalPaymentAmount?.toLocaleString()}원`);
        console.log(`  상태: ${po.productOrderStatus}`);
        console.log(`  주문일시: ${po.paymentDate || po.orderDate}`);
        if (po.shippingAddress) {
          console.log(`  수령인: ${po.shippingAddress.name || '(비공개)'}`);
        }
        console.log('');
      }
    }
    await new Promise(r => setTimeout(r, 300));
  }
} else {
  console.log(`(주문이 ${allOrderIds.length}건으로 많아 요약만 표시합니다. 'detail' 옵션 사용 시 상세 표시)`);
  console.log(`주문번호 목록: ${allOrderIds.slice(0, 10).join(', ')}${allOrderIds.length > 10 ? '...' : ''}`);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`완료: 총 ${allOrderIds.length}건 조회`);

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

const CLIENT_ID = env.NAVER_COMMERCE_APP_ID;
const CLIENT_SECRET = env.NAVER_COMMERCE_APP_SECRET;
const BASE_URL = 'https://api.commerce.naver.com/external';

async function getToken() {
  const ts = Date.now();
  const hashed = bcrypt.hashSync(`${CLIENT_ID}_${ts}`, CLIENT_SECRET);
  const sign = Buffer.from(hashed).toString('base64');
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    timestamp: String(ts),
    client_secret_sign: sign,
    grant_type: 'client_credentials',
    type: 'SELF',
  });
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json();
  return data.access_token;
}

// 로컬 이미지 파일을 네이버에 업로드
async function uploadLocalImage(token, localPath) {
  const fullPath = resolve(ROOT, 'public', localPath.replace(/^\//, ''));
  const imgBuffer = readFileSync(fullPath);
  const ext = localPath.split('.').pop().toLowerCase();
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  const fileName = localPath.split('/').pop();

  const boundary = '----FormBoundary' + Date.now();
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="imageFiles"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;

  const bodyBuf = Buffer.concat([
    Buffer.from(header, 'utf-8'),
    imgBuffer,
    Buffer.from(footer, 'utf-8'),
  ]);

  const res = await fetch(`${BASE_URL}/v1/product-images/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: bodyBuf,
  });

  const data = await res.json();
  if (data.images && data.images.length > 0) {
    return data.images[0].url;
  }
  console.log('  업로드 실패:', JSON.stringify(data).slice(0, 300));
  return null;
}

const token = await getToken();
console.log('Token:', token ? 'OK' : 'FAIL');

// Step 1: 이미지 업로드
const localImagePath = '/images/products/artsy/artsy-001-poster-black.jpg';
console.log(`\n📷 이미지 업로드: ${localImagePath}`);
const naverImageUrl = await uploadLocalImage(token, localImagePath);

if (!naverImageUrl) {
  console.error('❌ 이미지 업로드 실패 — 종료');
  process.exit(1);
}
console.log(`✅ 네이버 이미지 URL: ${naverImageUrl}`);

// Step 2: 상품 등록
const testProduct = {
  originProduct: {
    statusType: 'SALE',
    leafCategoryId: '50006312',
    name: '[SILVERTAPE] Echoes of Crimson — 진홍의 메아리 아트 프린트 포스터',
    images: {
      representativeImage: { url: naverImageUrl },
    },
    detailContent: `<div style="text-align:center;padding:20px;"><img src="${naverImageUrl}" alt="Echoes of Crimson" style="max-width:100%;"/><h2>Echoes of Crimson — 진홍의 메아리</h2><p style="margin-top:20px;"><a href="https://silvertape.art/studio/hangover/echoes-of-crimson" target="_blank">▶ SILVERTAPE에서 자세히 보기 (액자 포함 옵션)</a></p></div>`,
    salePrice: 30000,
    stockQuantity: 999,
    deliveryInfo: {
      deliveryType: 'DELIVERY',
      deliveryAttributeType: 'NORMAL',
      deliveryCompany: 'CJGLS',
      deliveryFee: {
        deliveryFeeType: 'FREE',
      },
      claimDeliveryInfo: {
        returnDeliveryFee: 5000,
        exchangeDeliveryFee: 5000,
      },
    },
    detailAttribute: {
      naverShoppingSearchInfo: {
        manufacturerName: 'SILVERTAPE',
        brandName: 'SILVERTAPE',
      },
      afterServiceInfo: {
        afterServiceTelephoneNumber: '010-0000-0000',
        afterServiceGuideContent: '이메일 문의: hello@silvertape.art',
      },
      originAreaInfo: {
        originAreaCode: '03',
        content: '상세설명에 표시',
      },
      minorPurchasable: true,
      productInfoProvidedNotice: {
        productInfoProvidedNoticeType: 'ETC',
        etc: {
          returnCostReason: '초기 불량 시 반품 배송비 판매자 부담, 단순 변심 시 구매자 부담 (5,000원)',
          noRefundReason: '주문 제작 상품으로 제작 착수 이후 단순 변심에 의한 환불 불가',
          qualityAssuranceStandard: '소비자분쟁해결기준에 따름',
          compensationProcedure: '소비자분쟁해결기준에 따름',
          troubleShootingContents: '이메일 문의: hello@silvertape.art',
          itemName: '아트 프린트 포스터',
          modelName: '상세 설명 참조',
          manufacturer: 'SILVERTAPE',
          customerServicePhoneNumber: '010-0000-0000',
        },
      },
    },
  },
  smartstoreChannelProduct: {
    channelProductName: '[SILVERTAPE] Echoes of Crimson — 진홍의 메아리 아트 프린트 포스터',
    channelProductDisplayStatusType: 'ON',
    naverShoppingRegistration: true,
  },
};

console.log('\n📦 상품 등록 중...');
const res = await fetch(`${BASE_URL}/v2/products`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testProduct),
});

console.log('Status:', res.status);
const data = await res.json();
console.log('Response:', JSON.stringify(data, null, 2));

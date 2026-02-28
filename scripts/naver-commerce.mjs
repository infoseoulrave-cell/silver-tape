/**
 * 네이버 커머스 API — 인증 + 상품 일괄 등록 스크립트
 *
 * 사용법:
 *   node scripts/naver-commerce.mjs test       # API 연결 테스트
 *   node scripts/naver-commerce.mjs categories  # 카테고리 조회
 *   node scripts/naver-commerce.mjs register    # 프린트 상품 일괄 등록
 *   node scripts/naver-commerce.mjs delete-test # 테스트 상품 삭제
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';

// ── .env.local 수동 로드 ──────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const envPath = resolve(ROOT, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const CLIENT_ID = process.env.NAVER_COMMERCE_APP_ID;
const CLIENT_SECRET = process.env.NAVER_COMMERCE_APP_SECRET;
const BASE_URL = 'https://api.commerce.naver.com/external';
const SITE_URL = 'https://silvertape.art';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ .env.local에 NAVER_COMMERCE_APP_ID / NAVER_COMMERCE_APP_SECRET이 필요합니다.');
  process.exit(1);
}

// ── 인증: bcrypt 서명 생성 → 토큰 발급 ──────────────
async function getAccessToken() {
  const timestamp = Date.now();
  const password = `${CLIENT_ID}_${timestamp}`;
  const hashed = bcrypt.hashSync(password, CLIENT_SECRET);
  const clientSecretSign = Buffer.from(hashed).toString('base64');

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    timestamp: String(timestamp),
    client_secret_sign: clientSecretSign,
    grant_type: 'client_credentials',
    type: 'SELF',
  });

  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    console.error('❌ 토큰 발급 실패:', data);
    process.exit(1);
  }

  console.log('✅ 토큰 발급 성공 (유효시간:', data.expires_in, '초)');
  return data.access_token;
}

// ── API 호출 헬퍼 ────────────────────────────────────
async function apiGet(token, path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function apiPost(token, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: { code: 'PARSE_ERROR', message: text.slice(0, 100) } };
  }
}

// ── 이미지 업로드 (로컬 → 네이버 CDN, WebP→JPG 자동 변환) ──
async function uploadImage(token, localImagePath) {
  const fullPath = resolve(ROOT, 'public', localImagePath.replace(/^\//, ''));

  if (!existsSync(fullPath)) {
    console.log(`    ⚠️ 이미지 없음: ${fullPath}`);
    return null;
  }

  let imgBuffer = readFileSync(fullPath);
  let ext = localImagePath.split('.').pop().toLowerCase();
  let fileName = localImagePath.split('/').pop();

  // WebP → JPEG 변환 (네이버는 JPEG/PNG/GIF/BMP만 지원)
  if (ext === 'webp') {
    imgBuffer = await sharp(imgBuffer).jpeg({ quality: 90 }).toBuffer();
    ext = 'jpg';
    fileName = fileName.replace('.webp', '.jpg');
  }

  // 10MB 초과 시 품질 낮춰서 재압축
  if (imgBuffer.length > 9_500_000) {
    imgBuffer = await sharp(imgBuffer).jpeg({ quality: 70 }).toBuffer();
    ext = 'jpg';
    fileName = fileName.replace(/\.\w+$/, '.jpg');
  }

  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;

  const boundary = '----FormBoundary' + Date.now() + Math.random().toString(36).slice(2);
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

  // API가 HTML을 반환하는 경우 처리
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (data.images && data.images.length > 0) {
      return data.images[0].url;
    }
    console.log(`    ⚠️ 이미지 업로드 실패:`, JSON.stringify(data).slice(0, 200));
  } catch {
    console.log(`    ⚠️ 이미지 업로드 비정상 응답 (${res.status})`);
  }
  return null;
}

// ── 명령: test ─────────────────────────────────────
async function cmdTest() {
  console.log('🔗 네이버 커머스 API 연결 테스트...\n');
  const token = await getAccessToken();

  const channelInfo = await apiGet(token, '/v1/seller/channels');
  console.log('\n📦 스토어 정보:');
  console.log(JSON.stringify(channelInfo, null, 2));
}

// ── 명령: categories ────────────────────────────────
async function cmdCategories() {
  const token = await getAccessToken();
  const result = await apiGet(token, '/v1/categories?name=포스터');
  console.log('\n📂 "포스터" 카테고리 검색 결과:');

  if (result.contents) {
    for (const cat of result.contents.slice(0, 20)) {
      console.log(`  ${cat.id} → ${cat.wholeCategoryName || cat.name}`);
    }
  } else {
    const all = await apiGet(token, '/v1/categories');
    console.log('전체 카테고리 응답 키:', Object.keys(all));
    console.log(JSON.stringify(all).slice(0, 500));
  }
}

// ── 명령: register ──────────────────────────────────
async function cmdRegister() {
  const token = await getAccessToken();

  // 상품 데이터 로드
  const productsPath = resolve(ROOT, 'src', 'data', 'products.ts');
  const productsSource = readFileSync(productsPath, 'utf-8');

  // 정규식으로 상품 파싱
  const productBlocks = productsSource.split(/\n\s*\{[\s\n]*id:/g).slice(1);
  const products = [];

  for (const block of productBlocks) {
    const get = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*'([^']*)'`));
      return m ? m[1] : '';
    };
    products.push({
      id: get('id') || block.match(/'([^']*)'/)?.[1] || '',
      slug: get('slug'),
      title: get('title'),
      titleKo: get('titleKo'),
      descriptionKo: get('descriptionKo'),
      image: get('image'),
      category: get('category'),
    });
  }

  // --retry 모드: 이미 등록된 상품 목록 조회하여 스킵
  const retryMode = process.argv.includes('--retry');
  let registeredNames = new Set();

  if (retryMode) {
    console.log('🔄 재시도 모드: 기존 등록 상품 확인 중...');
    try {
      const existing = await apiGet(token, '/v2/products/origin-products?size=500');
      if (existing.contents) {
        for (const p of existing.contents) {
          registeredNames.add(p.name);
        }
        console.log(`  → ${registeredNames.size}개 기존 상품 발견, 이들은 스킵합니다.`);
      }
    } catch {
      console.log('  → 기존 상품 조회 실패, 전체 등록 진행');
    }
  }

  console.log(`\n📦 ${products.length}개 상품 발견\n`);

  // 가격 (택배비 5,000원 포함 → 무료배송 표시)
  const SHIPPING_FEE = 5000;
  const sizes = [
    { id: '20x30', label: '20×30cm', price: 25000 + SHIPPING_FEE },
    { id: '30x40', label: '30×40cm', price: 35000 + SHIPPING_FEE },
    { id: '40x50', label: '40×50cm', price: 49000 + SHIPPING_FEE },
    { id: '50x75', label: '50×75cm', price: 69000 + SHIPPING_FEE },
  ];

  const LEAF_CATEGORY_ID = '50006312'; // 아트포스터

  let success = 0;
  let fail = 0;
  let skip = 0;

  for (const product of products) {
    if (!product.slug || !product.title) {
      skip++;
      continue;
    }

    const productName = `[SILVERTAPE] ${product.title} — ${product.titleKo} 아트 프린트 포스터`;

    // --retry: 이미 등록된 상품 스킵
    if (retryMode && registeredNames.has(productName)) {
      skip++;
      continue;
    }

    console.log(`  [${success + fail + skip + 1}/${products.length}] ${product.title}`);

    // 1) 이미지 업로드
    const naverImageUrl = await uploadImage(token, product.image);
    if (!naverImageUrl) {
      console.log(`    ❌ 이미지 업로드 실패 — 스킵`);
      fail++;
      await new Promise(r => setTimeout(r, 600));
      continue;
    }

    // 2) 상세 HTML
    const detailHtml = `<div style="text-align:center;padding:20px;"><img src="${naverImageUrl}" alt="${product.title}" style="max-width:100%;"/><h2>${product.title} — ${product.titleKo}</h2><p>${product.descriptionKo || ''}</p><table style="margin:20px auto;border-collapse:collapse;text-align:center;"><tr style="background:#f5f5f5;"><th style="padding:8px 16px;border:1px solid #ddd;">사이즈</th><th style="padding:8px 16px;border:1px solid #ddd;">프린트 가격</th></tr>${sizes.map(s => `<tr><td style="padding:8px 16px;border:1px solid #ddd;">${s.label}</td><td style="padding:8px 16px;border:1px solid #ddd;">${s.price.toLocaleString()}원</td></tr>`).join('')}</table><p style="margin-top:20px;font-size:14px;color:#666;">※ 액자 포함 옵션은 SILVERTAPE 공식 사이트에서 주문 가능합니다.</p><p style="margin-top:12px;"><a href="${SITE_URL}/studio/hangover/${product.slug}" style="display:inline-block;padding:12px 24px;background:#222;color:#fff;text-decoration:none;border-radius:4px;">▶ SILVERTAPE에서 자세히 보기</a></p></div>`;

    // 4) 상품 등록 payload
    const payload = {
      originProduct: {
        statusType: 'SALE',
        leafCategoryId: LEAF_CATEGORY_ID,
        name: productName,
        images: {
          representativeImage: { url: naverImageUrl },
        },
        detailContent: detailHtml,
        salePrice: sizes[0].price,
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
        channelProductName: productName,
        channelProductDisplayStatusType: 'ON',
        naverShoppingRegistration: true,
      },
    };

    // 사이즈 옵션 — 네이버 옵션가 ±15,000원 제한으로 인해
    // 옵션 미사용, 기본 사이즈(20×30cm)로만 등록
    // 큰 사이즈는 상세페이지에서 SILVERTAPE 사이트로 안내

    try {
      const { status, data } = await apiPost(token, '/v2/products', payload);

      if (status === 200 || status === 201) {
        console.log(`    ✅ 성공 (상품번호: ${data.originProductNo || 'OK'})`);
        success++;
      } else {
        const errMsg = data.invalidInputs
          ? data.invalidInputs.map(e => `${e.name}: ${e.message}`).join(', ')
          : JSON.stringify(data).slice(0, 200);
        console.log(`    ❌ 실패: ${errMsg}`);
        fail++;
      }
    } catch (err) {
      console.log(`    ❌ 에러: ${err.message}`);
      fail++;
    }

    // API 제한: 이미지 업로드 + 상품 등록 = 2개 요청이므로 여유있게
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ 성공: ${success}개 / ❌ 실패: ${fail}개 / ⏭️ 스킵: ${skip}개`);
}

// ── 메인 ──────────────────────────────────────────
const cmd = process.argv[2] || 'test';

switch (cmd) {
  case 'test':
    await cmdTest();
    break;
  case 'categories':
    await cmdCategories();
    break;
  case 'register':
    await cmdRegister();
    break;
  default:
    console.log('사용법: node scripts/naver-commerce.mjs [test|categories|register]');
}

/**
 * 네이버 스마트스토어 — 프레임 상품 일괄 등록
 * 기존 프린트 상품의 이미지를 재활용하여 액자 포함 상품을 등록
 *
 * 사용법:
 *   node scripts/naver-register-frames.mjs          → 전체 등록
 *   node scripts/naver-register-frames.mjs --retry   → 이미 등록된 상품 스킵
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';

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
const SITE_URL = 'https://silvertape.art';

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
  return (await res.json()).access_token;
}

async function uploadImage(token, localImagePath) {
  if (!localImagePath) return null;
  const fullPath = resolve(ROOT, 'public', localImagePath.replace(/^\//, ''));
  if (!existsSync(fullPath)) {
    console.log(`    ⚠️ 이미지 없음: ${fullPath}`);
    return null;
  }

  let imgBuffer = readFileSync(fullPath);
  let ext = localImagePath.split('.').pop().toLowerCase();
  let fileName = localImagePath.split('/').pop();

  if (ext === 'webp') {
    imgBuffer = await sharp(imgBuffer).jpeg({ quality: 90 }).toBuffer();
    ext = 'jpg';
    fileName = fileName.replace('.webp', '.jpg');
  }
  if (imgBuffer.length > 9_500_000) {
    imgBuffer = await sharp(imgBuffer).jpeg({ quality: 70 }).toBuffer();
    ext = 'jpg';
    fileName = fileName.replace(/\.\w+$/, '.jpg');
  }

  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  const boundary = '----FormBoundary' + Date.now() + Math.random().toString(36).slice(2);
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="imageFiles"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  const bodyBuf = Buffer.concat([Buffer.from(header), imgBuffer, Buffer.from(footer)]);

  const res = await fetch(`${BASE}/v1/product-images/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: bodyBuf,
  });

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (data.images && data.images.length > 0) return data.images[0].url;
    console.log(`    ⚠️ 이미지 업로드 실패:`, JSON.stringify(data).slice(0, 200));
  } catch {
    console.log(`    ⚠️ 이미지 업로드 비정상 응답 (${res.status})`);
  }
  return null;
}

// 카테고리별 SEO 설명
const CATEGORY_DESC = {
  fine: { style: '파인아트', mood: '고급스러운 갤러리 감성' },
  pop: { style: '팝아트', mood: '감각적이고 트렌디한' },
  urban: { style: '어반아트', mood: '모던하고 세련된 도시 감성' },
  fun: { style: '펀아트', mood: '유쾌하고 위트있는' },
  minimal: { style: '미니멀아트', mood: '깔끔하고 심플한' },
  photo: { style: '포토아트', mood: '감성적인 풍경' },
  retro: { style: '레트로아트', mood: '빈티지하고 복고적인' },
  object: { style: '오브제아트', mood: '독특하고 예술적인' },
};

const TAG_KO = {
  expressionism: '표현주의', abstract: '추상화', impasto: '임파스토',
  emotion: '감성아트', portrait: '초상화', 'neo-pop': '네오팝',
  figurative: '구상화', landscape: '풍경화', surreal: '초현실주의',
  minimal: '미니멀', geometric: '기하학아트', nature: '자연풍경',
  urban: '도시풍경', retro: '레트로', vintage: '빈티지',
  typography: '타이포그래피', space: '우주아트', architecture: '건축아트',
  pop: '팝아트', 'still-life': '정물화', car: '자동차아트',
  animal: '동물아트', flower: '꽃그림', neon: '네온아트',
  chrome: '크롬아트', modern: '모던아트', contemporary: '현대미술',
};

// 상품 데이터 파싱
const productsSource = readFileSync(resolve(ROOT, 'src', 'data', 'products.ts'), 'utf-8');
const productBlocks = productsSource.split(/\n\s*\{[\s\n]*id:/g).slice(1);
const products = [];
for (const block of productBlocks) {
  const get = (key) => {
    const m = block.match(new RegExp(`${key}:\\s*'([^']*)'`));
    return m ? m[1] : '';
  };
  const tagsMatch = block.match(/tags:\s*\[([^\]]*)\]/);
  const tags = tagsMatch
    ? tagsMatch[1].match(/'([^']*)'/g)?.map(t => t.replace(/'/g, '')) || []
    : [];
  products.push({
    slug: get('slug'),
    title: get('title'),
    titleKo: get('titleKo'),
    category: get('category'),
    descriptionKo: get('descriptionKo'),
    image: get('image'),
    tags,
  });
}

// 이미지 기반 중복 제거 (원본 등록 스크립트와 동일)
const seen = new Set();
const uniqueProducts = [];
for (const p of products) {
  if (!p.image || seen.has(p.image)) continue;
  seen.add(p.image);
  uniqueProducts.push(p);
}
products.length = 0;
products.push(...uniqueProducts);

// 프레임 가격 (프린트 + 액자 + 배송비 5000원)
const FRAME_PRICE = 25000 + 87000 + 5000; // 117,000원 (20×30cm)
const LEAF_CATEGORY_ID = '50006312'; // 아트포스터

function buildFrameDetailHtml(p, imageUrl) {
  const cat = CATEGORY_DESC[p.category] || CATEGORY_DESC.fine;
  const koreanTags = p.tags.map(t => TAG_KO[t]).filter(Boolean);

  return `
<div style="max-width:860px;margin:0 auto;padding:20px;font-family:'Noto Sans KR',sans-serif;color:#222;">

  ${imageUrl ? `<div style="text-align:center;margin-bottom:32px;">
    <img src="${imageUrl}" alt="${p.titleKo} ${p.title} 액자 아트프린트" style="max-width:100%;border-radius:4px;"/>
  </div>` : ''}

  <h1 style="font-size:24px;font-weight:700;text-align:center;margin-bottom:8px;">
    ${p.titleKo} | ${p.title}
  </h1>
  <p style="text-align:center;font-size:16px;color:#c0392b;font-weight:600;margin-bottom:8px;">
    프리미엄 액자 포함 아트프린트
  </p>
  <p style="text-align:center;font-size:15px;color:#888;margin-bottom:32px;">
    SILVERTAPE ${cat.style} 컬렉션 | 20×30cm (A4) 사이즈
  </p>

  <div style="background:#fafafa;padding:24px;border-radius:8px;margin-bottom:32px;">
    <h2 style="font-size:18px;font-weight:600;margin-bottom:12px;">작품 소개</h2>
    <p style="font-size:15px;line-height:1.8;color:#444;">
      ${p.descriptionKo || `${p.titleKo}은(는) SILVERTAPE의 ${cat.style} 컬렉션 작품입니다.`}
    </p>
    ${koreanTags.length ? `<p style="font-size:14px;color:#666;margin-top:12px;"><strong>스타일:</strong> ${koreanTags.join(', ')}</p>` : ''}
  </div>

  <div style="margin-bottom:32px;">
    <h2 style="font-size:18px;font-weight:600;margin-bottom:12px;">액자 상세 정보</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:10px;border:1px solid #e0e0e0;background:#f9f9f9;font-weight:600;width:30%;">프린트 사이즈</td><td style="padding:10px;border:1px solid #e0e0e0;">20×30cm (A4)</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;background:#f9f9f9;font-weight:600;">액자 재질</td><td style="padding:10px;border:1px solid #e0e0e0;">프리미엄 알루미늄 프레임</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;background:#f9f9f9;font-weight:600;">프레임 색상</td><td style="padding:10px;border:1px solid #e0e0e0;">블랙 / 화이트 / 월넛 (주문 시 선택)</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;background:#f9f9f9;font-weight:600;">유리</td><td style="padding:10px;border:1px solid #e0e0e0;">아크릴 글래스 (비산방지)</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;background:#f9f9f9;font-weight:600;">프린트</td><td style="padding:10px;border:1px solid #e0e0e0;">고급 무광 아트지 + 아카이벌 잉크</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;background:#f9f9f9;font-weight:600;">배송비</td><td style="padding:10px;border:1px solid #e0e0e0;">무료</td></tr>
    </table>
  </div>

  <div style="margin-bottom:32px;">
    <h2 style="font-size:18px;font-weight:600;margin-bottom:12px;">다른 사이즈 액자</h2>
    <table style="width:100%;border-collapse:collapse;text-align:center;">
      <thead><tr style="background:#f5f5f5;">
        <th style="padding:12px;border:1px solid #e0e0e0;">사이즈</th>
        <th style="padding:12px;border:1px solid #e0e0e0;">액자 포함 가격</th>
        <th style="padding:12px;border:1px solid #e0e0e0;">구매</th>
      </tr></thead>
      <tbody>
        <tr style="background:#fff8f0;">
          <td style="padding:12px;border:1px solid #e0e0e0;font-weight:600;">20×30cm (A4)</td>
          <td style="padding:12px;border:1px solid #e0e0e0;font-weight:600;color:#c0392b;">112,000원</td>
          <td style="padding:12px;border:1px solid #e0e0e0;">현재 상품</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #e0e0e0;">30×40cm</td>
          <td style="padding:12px;border:1px solid #e0e0e0;">155,000원</td>
          <td style="padding:12px;border:1px solid #e0e0e0;"><a href="${SITE_URL}/studio/hangover/${p.slug}" style="color:#2980b9;">공식 사이트</a></td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #e0e0e0;">40×50cm</td>
          <td style="padding:12px;border:1px solid #e0e0e0;">229,000원</td>
          <td style="padding:12px;border:1px solid #e0e0e0;"><a href="${SITE_URL}/studio/hangover/${p.slug}" style="color:#2980b9;">공식 사이트</a></td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #e0e0e0;">50×75cm</td>
          <td style="padding:12px;border:1px solid #e0e0e0;">304,000원</td>
          <td style="padding:12px;border:1px solid #e0e0e0;"><a href="${SITE_URL}/studio/hangover/${p.slug}" style="color:#2980b9;">공식 사이트</a></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div style="margin-bottom:32px;">
    <h2 style="font-size:18px;font-weight:600;margin-bottom:12px;">SILVERTAPE 프레임 특징</h2>
    <ul style="font-size:15px;line-height:2;color:#444;padding-left:20px;">
      <li><strong>프리미엄 알루미늄 프레임</strong> — 가볍고 견고한 고급 프레임</li>
      <li><strong>아크릴 글래스</strong> — 비산방지 처리, 자외선 차단</li>
      <li><strong>고품질 아트지</strong> — 100년 이상 변색 없는 아카이벌 잉크</li>
      <li><strong>한정판 에디션</strong> — 넘버링으로 소장 가치 보장</li>
      <li><strong>무료 배송</strong> — 안전 포장 후 무료 배송</li>
      <li><strong>바로 걸 수 있는</strong> — 행잉 키트 포함, 도착 즉시 설치</li>
    </ul>
  </div>

  <div style="background:#111;color:#fff;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
    <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">SILVERTAPE</h2>
    <p style="font-size:14px;color:#ccc;line-height:1.6;">
      Art Prints for Your Everyday Space<br/>일상의 공간을 갤러리로
    </p>
    <a href="${SITE_URL}/studio/hangover/${p.slug}"
       style="display:inline-block;margin-top:16px;padding:12px 32px;background:#fff;color:#111;text-decoration:none;border-radius:4px;font-weight:600;">
      ▶ 더 많은 사이즈 보기
    </a>
  </div>

  <div style="font-size:12px;color:#bbb;line-height:1.6;margin-top:24px;">
    <p>
      ${p.titleKo} ${p.title} 액자 아트프린트 | SILVERTAPE 실버테이프 |
      인테리어 액자 프레임 포함 | 거실 인테리어 벽면 장식 |
      ${koreanTags.join(' ')} | 프리미엄 액자 아트 프린트 |
      집들이 선물 기념일 선물 결혼 선물 | 모던 인테리어 감성 인테리어 |
      카페 인테리어 오피스 인테리어 | 한정판 에디션 아트워크 갤러리
    </p>
  </div>

</div>`.trim();
}

// ── 메인 실행 ──────────────────────────────────

const token = await getToken();
console.log('토큰 발급 완료\n');

// 기존 등록 상품 확인 (--retry 모드)
const retryMode = process.argv.includes('--retry');
let registeredNames = new Set();

if (retryMode) {
  const searchRes = await fetch(`${BASE}/v1/products/search`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productStatusTypes: ['SALE'], page: 1, size: 200 }),
  });
  const existing = await searchRes.json();
  if (existing.contents) {
    for (const p of existing.contents) {
      registeredNames.add(p.channelProducts?.[0]?.name || p.name);
    }
    console.log(`기존 등록 상품: ${registeredNames.size}개 (중복 스킵)\n`);
  }
}

console.log(`프레임 상품 ${products.length}개 등록 시작\n`);

let success = 0, fail = 0, skip = 0;

for (const product of products) {
  if (!product.slug || !product.title) { skip++; continue; }

  const productName = `${product.titleKo} ${product.title} 액자 아트프린트 인테리어액자 | SILVERTAPE`;

  if (retryMode && registeredNames.has(productName)) {
    skip++;
    continue;
  }

  console.log(`  [${success + fail + skip + 1}/${products.length}] ${product.title} (프레임)`);

  // 1) 이미지 업로드
  const naverImageUrl = await uploadImage(token, product.image);
  if (!naverImageUrl) {
    console.log(`    ❌ 이미지 업로드 실패 — 스킵`);
    fail++;
    await new Promise(r => setTimeout(r, 600));
    continue;
  }

  // 2) 상세 HTML
  const detailHtml = buildFrameDetailHtml(product, naverImageUrl);

  // 3) SEO 태그
  const catTags = {
    fine: ['액자아트프린트', '파인아트액자', '인테리어액자'],
    pop: ['팝아트액자', '감성액자', '인테리어액자'],
    urban: ['모던액자', '도시감성액자', '인테리어액자'],
    fun: ['감성액자', '유니크액자', '인테리어액자'],
    minimal: ['미니멀액자', '심플액자', '인테리어액자'],
    photo: ['포토액자', '풍경액자', '인테리어액자'],
    retro: ['레트로액자', '빈티지액자', '인테리어액자'],
    object: ['오브제액자', '정물액자', '인테리어액자'],
  };
  const koreanTags = product.tags.map(t => TAG_KO[t]).filter(Boolean);
  const allTags = [...new Set([
    '액자아트프린트', '실버테이프', '인테리어액자', 'SILVERTAPE',
    ...(catTags[product.category] || catTags.fine).slice(0, 2),
    ...koreanTags.slice(0, 3),
    product.titleKo,
  ])].filter(t => t && /^[a-zA-Z가-힣0-9\s]+$/.test(t)).slice(0, 10);

  // 4) 등록 payload
  const payload = {
    originProduct: {
      statusType: 'SALE',
      leafCategoryId: LEAF_CATEGORY_ID,
      name: productName,
      images: { representativeImage: { url: naverImageUrl } },
      detailContent: detailHtml,
      salePrice: FRAME_PRICE,
      stockQuantity: 999,
      deliveryInfo: {
        deliveryType: 'DELIVERY',
        deliveryAttributeType: 'NORMAL',
        deliveryCompany: 'CJGLS',
        deliveryFee: { deliveryFeeType: 'FREE' },
        claimDeliveryInfo: { returnDeliveryFee: 5000, exchangeDeliveryFee: 5000 },
      },
      detailAttribute: {
        naverShoppingSearchInfo: { manufacturerName: 'SILVERTAPE', brandName: 'SILVERTAPE' },
        afterServiceInfo: {
          afterServiceTelephoneNumber: '010-0000-0000',
          afterServiceGuideContent: '이메일 문의: hello@silvertape.art',
        },
        originAreaInfo: { originAreaCode: '03', content: '상세설명에 표시' },
        minorPurchasable: true,
        seoInfo: {
          pageTitle: `${product.title} - ${product.titleKo} 액자 아트프린트 | SILVERTAPE`,
          metaDescription: `SILVERTAPE ${product.titleKo} (${product.title}) 프리미엄 액자 포함 아트프린트 | 인테리어 액자 | 무료배송`,
          sellerTags: allTags.map(tag => ({ text: tag })),
        },
        productInfoProvidedNotice: {
          productInfoProvidedNoticeType: 'ETC',
          etc: {
            returnCostReason: '초기 불량 시 반품 배송비 판매자 부담, 단순 변심 시 구매자 부담 (5,000원)',
            noRefundReason: '주문 제작 상품으로 제작 착수 이후 단순 변심에 의한 환불 불가',
            qualityAssuranceStandard: '소비자분쟁해결기준에 따름',
            compensationProcedure: '소비자분쟁해결기준에 따름',
            troubleShootingContents: '이메일 문의: hello@silvertape.art',
            itemName: '아트프린트 액자 (프레임 포함)',
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

  // 프레임 컬러 옵션 추가 (가격 동일)
  payload.originProduct.optionInfo = {
    optionCombinationSortType: 'CREATE',
    optionCombinationGroupNames: { optionGroupName1: '프레임 색상' },
    optionCombinations: [
      { optionName1: '블랙', stockQuantity: 999, price: 0, usable: true },
      { optionName1: '화이트', stockQuantity: 999, price: 0, usable: true },
      { optionName1: '월넛', stockQuantity: 999, price: 0, usable: true },
    ],
  };

  // 5) 등록 요청
  const res = await fetch(`${BASE}/v2/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (res.status === 200 || res.status === 201) {
      console.log(`    ✅ 성공 (상품번호: ${data.originProductNo || 'OK'})`);
      success++;
    } else {
      const err = data.invalidInputs
        ? data.invalidInputs.map(e => `${e.name}: ${e.message}`).join(', ')
        : data.message || JSON.stringify(data).slice(0, 150);
      console.log(`    ❌ ${err}`);
      fail++;
    }
  } catch {
    console.log(`    ❌ 비정상 응답 (${res.status}): ${text.slice(0, 100)}`);
    fail++;
  }

  await new Promise(r => setTimeout(r, 800));
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅ 프레임 상품 등록: ${success}개`);
console.log(`❌ 실패: ${fail}개`);
console.log(`⏭️ 스킵: ${skip}개`);

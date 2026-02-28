/**
 * 네이버 스마트스토어 SEO 최적화 — 태그 + 상품명 업데이트
 * GET 상품 → 태그/상품명 수정 → PUT 상품
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
  return (await res.json()).access_token;
}

// 카테고리 → 한국어 검색 키워드
// 네이버 금지 태그: 포스터, 미술작품, 그림, 액자 등 카테고리명과 동일한 단어
const CATEGORY_TAGS = {
  fine: ['아트프린트', '파인아트프린트', '인테리어작품', '거실인테리어', '벽면장식'],
  pop: ['팝아트프린트', '감성인테리어', '벽면꾸미기', '거실인테리어', '모던장식'],
  urban: ['도시감성', '모던인테리어', '감성인테리어', '벽면꾸미기', '거실장식'],
  fun: ['유머러스아트', '감성인테리어', '벽면꾸미기', '캐릭터아트', '인테리어장식'],
  minimal: ['미니멀아트', '모던인테리어', '심플인테리어', '감성인테리어', '거실장식'],
  photo: ['포토아트', '감성인테리어', '풍경인테리어', '벽면꾸미기', '거실장식'],
  retro: ['레트로감성', '빈티지인테리어', '복고풍인테리어', '빈티지아트', '레트로장식'],
  object: ['오브제아트', '정물아트', '인테리어작품', '스틸라이프', '아트프린트'],
};
const COMMON_TAGS = ['아트프린트', '실버테이프', '인테리어장식', 'SILVERTAPE'];
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

// products.ts 파싱
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
    slug: get('slug'), title: get('title'), titleKo: get('titleKo'),
    category: get('category'), tags,
  });
}

const token = await getToken();
console.log('✅ 토큰 발급 완료\n');

// 등록 상품 조회
const searchRes = await fetch(`${BASE}/v1/products/search`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ productStatusTypes: ['SALE'], page: 1, size: 100 }),
});
const registered = (await searchRes.json()).contents || [];
console.log(`📦 등록 상품: ${registered.length}개\n`);

let updated = 0, failed = 0;

for (const item of registered) {
  const productNo = item.originProductNo;
  const channelName = item.channelProducts?.[0]?.name || '';
  const matched = products.find(p => p.title && channelName.includes(p.title));
  if (!matched) continue;

  // 1) 기존 상품 상세 GET
  const getRes = await fetch(`${BASE}/v2/products/origin-products/${productNo}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getText = await getRes.text();
  let existing;
  try { existing = JSON.parse(getText); } catch {
    console.log(`  ${matched.title} → GET 실패`);
    failed++;
    await new Promise(r => setTimeout(r, 500));
    continue;
  }

  if (!existing.originProduct) {
    console.log(`  ${matched.title} → 응답에 originProduct 없음`);
    failed++;
    await new Promise(r => setTimeout(r, 500));
    continue;
  }

  // 2) SEO 태그 생성
  const catTags = CATEGORY_TAGS[matched.category] || CATEGORY_TAGS.fine;
  const pTags = matched.tags.map(t => TAG_KO[t]).filter(Boolean);
  const allTags = [...new Set([
    ...COMMON_TAGS, ...catTags.slice(0, 3), ...pTags.slice(0, 3), matched.titleKo,
  ])].filter(Boolean).slice(0, 10);

  // 3) SEO 최적화 상품명
  const seoName = `${matched.titleKo} ${matched.title} 아트프린트 포스터 인테리어액자 | SILVERTAPE`;

  console.log(`  ${matched.title} → [${allTags.slice(0, 5).join(', ')}...]`);

  // 4) 기존 데이터에 SEO 정보 추가
  const origin = existing.originProduct;
  origin.name = seoName;

  // seoInfo — 태그는 code 없이 text만 전달
  if (!origin.detailAttribute) origin.detailAttribute = {};
  origin.detailAttribute.seoInfo = {
    pageTitle: `${matched.title} - ${matched.titleKo} | SILVERTAPE 아트 프린트`,
    metaDescription: `SILVERTAPE ${matched.titleKo} (${matched.title}) 고품질 아트 프린트 포스터 | 인테리어 액자 | 무료배송`,
    sellerTags: allTags.map(tag => ({ text: tag })),
  };

  // detailContent 제거 (PUT 시 기존 유지)
  delete origin.detailContent;

  // 5) PUT 업데이트
  const putRes = await fetch(`${BASE}/v2/products/origin-products/${productNo}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originProduct: origin,
      smartstoreChannelProduct: {
        channelProductName: seoName,
        channelProductDisplayStatusType: 'ON',
        naverShoppingRegistration: true,
      },
    }),
  });

  const putText = await putRes.text();
  try {
    const putData = JSON.parse(putText);
    if (putRes.status === 200) {
      updated++;
    } else {
      const err = putData.invalidInputs
        ? putData.invalidInputs.map(e => e.message).join(', ')
        : putData.message || '';
      console.log(`    ❌ ${err.slice(0, 100)}`);
      failed++;
    }
  } catch {
    console.log(`    ❌ 비정상 응답 (${putRes.status})`);
    failed++;
  }

  await new Promise(r => setTimeout(r, 600));
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅ SEO 업데이트: ${updated}개 / ❌ 실패: ${failed}개`);

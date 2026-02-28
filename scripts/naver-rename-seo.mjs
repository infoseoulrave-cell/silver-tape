/**
 * 네이버 스마트스토어 상품명 SEO 최적화
 * 작품명 대신 검색 키워드 위주로 상품명 변경
 *
 * 사용법:
 *   node scripts/naver-rename-seo.mjs          → 전체 업데이트
 *   node scripts/naver-rename-seo.mjs test      → 첫 2개만 테스트
 *   node scripts/naver-rename-seo.mjs dry       → 변경 내용만 출력 (실제 반영 X)
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

const MODE = process.argv[2] || 'full'; // full | test | dry

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
    id: get('id'),
    slug: get('slug'),
    title: get('title'),
    titleKo: get('titleKo'),
    category: get('category'),
    artist: get('artist'),
    tags,
  });
}

// 태그 → 한국어
const TAG_KO = {
  expressionism: '표현주의', abstract: '추상화', impasto: '임파스토',
  emotion: '감성아트', portrait: '초상화', 'neo-pop': '네오팝',
  figurative: '구상화', landscape: '풍경화', surreal: '초현실',
  minimal: '미니멀', geometric: '기하학', nature: '자연풍경',
  urban: '도시감성', retro: '레트로', vintage: '빈티지',
  typography: '타이포', space: '우주', architecture: '건축',
  pop: '팝아트', 'still-life': '정물', car: '자동차',
  animal: '동물', flower: '플라워', neon: '네온',
  chrome: '크롬', modern: '모던아트', contemporary: '현대미술',
  monochrome: '모노톤', halftone: '하프톤', calligraphy: '캘리',
  ink: '수묵', film: '필름', lunar: '달', liminal: '리미널',
  material: '물성', collage: '콜라주', contradiction: '오브제',
};

// 카테고리별 스타일 키워드
const CAT_STYLE = {
  fine: ['감성', '갤러리풍', '클래식', '고급'],
  blk: ['모던흑백', '모노톤', '미니멀', 'B&W'],
  pop: ['팝아트', '컬러풀', '트렌디', '감각적'],
  fun: ['유니크', '위트', '펀아트', '유쾌한'],
  art: ['현대미술', '컨템포러리', '갤러리풍', '아트워크'],
  witty: ['위트', '센스', '유머', '펀아트'],
};

// 공간 키워드 (순환)
const SPACES = ['거실', '침실', '오피스', '카페', '서재', '복도'];
// 선물 키워드 (순환)
const GIFTS = ['집들이선물', '이사선물', '기념일선물', '생일선물', '개업선물', '결혼선물'];

// 전역 카운터 (프린트/프레임 독립)
let printNum = 0;
let frameNum = 0;

function buildSeoName(product, isFrame) {
  const num = isFrame ? ++frameNum : ++printNum;
  const catStyles = CAT_STYLE[product.category] || CAT_STYLE.fine;
  const style = catStyles[(num - 1) % catStyles.length];

  // 태그 키워드 2개
  const tagKws = product.tags.map(t => TAG_KO[t]).filter(Boolean);
  const tag1 = tagKws[0] || '';
  const tag2 = tagKws[1] || '';

  const space = SPACES[(num - 1) % SPACES.length];
  const gift = GIFTS[(num - 1) % GIFTS.length];

  if (isFrame) {
    // 프레임: "스타일 인테리어액자 태그 디자인포스터 공간 벽장식 선물 No.XX SILVERTAPE"
    return [
      style, '인테리어액자',
      tag1, '디자인포스터',
      space, '벽장식', gift,
      `No.${String(num).padStart(2, '0')}`,
      'SILVERTAPE',
    ].filter(Boolean).join(' ');
  } else {
    // 프린트: "스타일 디자인포스터 태그 아트프린트 공간인테리어 벽꾸미기 선물 No.XX SILVERTAPE"
    return [
      style, '디자인포스터',
      tag1, '아트프린트',
      `${space}인테리어`, '벽꾸미기', gift,
      `No.${String(num).padStart(2, '0')}`,
      'SILVERTAPE',
    ].filter(Boolean).join(' ');
  }
}

const token = await getToken();
console.log('토큰 발급 완료\n');

// 등록 상품 조회
const searchRes = await fetch(`${BASE}/v1/products/search`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ productStatusTypes: ['SALE'], page: 1, size: 200 }),
});
const registered = (await searchRes.json()).contents || [];
console.log(`등록 상품: ${registered.length}개\n`);

let updated = 0, failed = 0, skipped = 0;
const limit = MODE === 'test' ? 2 : registered.length;

for (let idx = 0; idx < Math.min(registered.length, limit); idx++) {
  const item = registered[idx];
  const productNo = item.originProductNo;
  const channelName = item.channelProducts?.[0]?.name || '';

  // 프레임 vs 프린트 감지: 프린트 상품은 "포스터"를 포함
  const isFrame = !channelName.includes('포스터');

  // products.ts와 매칭 (영문 title로)
  const matched = products.find(p => p.title && channelName.includes(p.title));
  if (!matched) {
    console.log(`  ⏭️ 매칭 실패: "${channelName.slice(0, 50)}"`);
    skipped++;
    continue;
  }

  const newName = buildSeoName(matched, isFrame);
  const typeLabel = isFrame ? '🖼️ 액자' : '📄 프린트';

  if (MODE === 'dry') {
    console.log(`  ${typeLabel} ${channelName.slice(0, 45)}`);
    console.log(`       → ${newName}`);
    updated++;
    continue;
  }

  // GET 기존 상품
  const getRes = await fetch(`${BASE}/v2/products/origin-products/${productNo}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getText = await getRes.text();
  let existing;
  try { existing = JSON.parse(getText); } catch {
    console.log(`  ❌ ${matched.title} → GET 실패`);
    failed++;
    await new Promise(r => setTimeout(r, 500));
    continue;
  }

  if (!existing.originProduct) {
    console.log(`  ❌ ${matched.title} → originProduct 없음`);
    failed++;
    await new Promise(r => setTimeout(r, 500));
    continue;
  }

  const origin = existing.originProduct;
  origin.name = newName;

  // PUT 업데이트
  const putRes = await fetch(`${BASE}/v2/products/origin-products/${productNo}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originProduct: origin,
      smartstoreChannelProduct: {
        channelProductName: newName,
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
      console.log(`  ✅ ${typeLabel} → ${newName}`);
    } else {
      const err = putData.invalidInputs
        ? putData.invalidInputs.map(e => e.message).join(', ')
        : putData.message || '';
      console.log(`  ❌ ${matched.title} → ${err.slice(0, 120)}`);
      failed++;
    }
  } catch {
    console.log(`  ❌ ${matched.title} → 비정상 응답 (${putRes.status})`);
    failed++;
  }

  await new Promise(r => setTimeout(r, 600));
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅ 상품명 변경: ${updated}개`);
console.log(`❌ 실패: ${failed}개`);
console.log(`⏭️ 스킵: ${skipped}개`);

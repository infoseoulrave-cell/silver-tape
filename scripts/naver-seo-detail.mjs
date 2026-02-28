/**
 * 네이버 상품 상세설명(detailContent) SEO 강화
 * 기존 상세설명 → 키워드 풍부한 HTML로 업데이트
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

// 카테고리별 SEO 키워드
const CATEGORY_DESC = {
  fine: { style: '파인아트', mood: '고급스러운 갤러리 감성', room: '거실, 서재, 오피스' },
  pop: { style: '팝아트', mood: '감각적이고 트렌디한', room: '거실, 카페, 상업공간' },
  urban: { style: '어반아트', mood: '모던하고 세련된 도시 감성', room: '거실, 오피스, 카페' },
  fun: { style: '펀아트', mood: '유쾌하고 위트있는', room: '거실, 아이방, 카페' },
  minimal: { style: '미니멀아트', mood: '깔끔하고 심플한', room: '거실, 침실, 오피스' },
  photo: { style: '포토아트', mood: '감성적인 풍경', room: '거실, 침실, 복도' },
  retro: { style: '레트로아트', mood: '빈티지하고 복고적인', room: '거실, 카페, 바' },
  object: { style: '오브제아트', mood: '독특하고 예술적인', room: '거실, 서재, 갤러리' },
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

// products.ts 파싱
const productsSource = readFileSync(resolve(ROOT, 'src', 'data', 'products.ts'), 'utf-8');
const productBlocks = productsSource.split(/\n\s*\{[\s\n]*id:/g).slice(1);
const products = [];
for (const block of productBlocks) {
  const get = (key) => {
    const m = block.match(new RegExp(`${key}:\\s*'([^']*)'`));
    return m ? m[1] : '';
  };
  const getMulti = (key) => {
    const m = block.match(new RegExp(`${key}:\\s*'([^']*)'`));
    if (m) return m[1];
    // 여러 줄 문자열
    const m2 = block.match(new RegExp(`${key}:\\s*'([\\s\\S]*?)'`));
    return m2 ? m2[1] : '';
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

// SEO 강화 상세 HTML 생성
function buildSeoDetailHtml(p, existingImageUrl) {
  const cat = CATEGORY_DESC[p.category] || CATEGORY_DESC.fine;
  const koreanTags = p.tags.map(t => TAG_KO[t]).filter(Boolean);
  const tagText = koreanTags.join(', ');

  return `
<div style="max-width:860px;margin:0 auto;padding:20px;font-family:'Noto Sans KR',sans-serif;color:#222;">

  <!-- 메인 이미지 -->
  ${existingImageUrl ? `<div style="text-align:center;margin-bottom:32px;">
    <img src="${existingImageUrl}" alt="${p.titleKo} ${p.title} 아트프린트" style="max-width:100%;border-radius:4px;"/>
  </div>` : ''}

  <!-- 작품 타이틀 -->
  <h1 style="font-size:24px;font-weight:700;text-align:center;margin-bottom:8px;">
    ${p.titleKo} | ${p.title}
  </h1>
  <p style="text-align:center;font-size:15px;color:#888;margin-bottom:32px;">
    SILVERTAPE 아트 프린트 컬렉션 | ${cat.style}
  </p>

  <!-- 작품 설명 -->
  <div style="background:#fafafa;padding:24px;border-radius:8px;margin-bottom:32px;">
    <h2 style="font-size:18px;font-weight:600;margin-bottom:12px;">작품 소개</h2>
    <p style="font-size:15px;line-height:1.8;color:#444;">
      ${p.descriptionKo || `${p.titleKo}은(는) SILVERTAPE의 ${cat.style} 컬렉션 작품입니다.`}
    </p>
    ${tagText ? `<p style="font-size:14px;color:#666;margin-top:12px;">
      <strong>스타일:</strong> ${tagText}
    </p>` : ''}
  </div>

  <!-- 인테리어 추천 -->
  <div style="margin-bottom:32px;">
    <h2 style="font-size:18px;font-weight:600;margin-bottom:12px;">인테리어 추천</h2>
    <p style="font-size:15px;line-height:1.8;color:#444;">
      ${p.titleKo} 아트프린트는 ${cat.mood} 분위기를 연출합니다.
      <strong>${cat.room}</strong> 등 다양한 공간에 어울리는 인테리어 작품입니다.
      벽면 장식, 인테리어 소품으로 완벽한 고품질 아트프린트 포스터입니다.
    </p>
  </div>

  <!-- 사이즈 안내 -->
  <div style="margin-bottom:32px;">
    <h2 style="font-size:18px;font-weight:600;margin-bottom:12px;">사이즈 & 가격 안내</h2>
    <table style="width:100%;border-collapse:collapse;text-align:center;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:12px;border:1px solid #e0e0e0;">사이즈</th>
          <th style="padding:12px;border:1px solid #e0e0e0;">프린트 가격</th>
          <th style="padding:12px;border:1px solid #e0e0e0;">추천 공간</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:12px;border:1px solid #e0e0e0;">20×30cm (A4)</td>
          <td style="padding:12px;border:1px solid #e0e0e0;">25,000원</td>
          <td style="padding:12px;border:1px solid #e0e0e0;">책상 위, 선반</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #e0e0e0;">30×40cm</td>
          <td style="padding:12px;border:1px solid #e0e0e0;">35,000원</td>
          <td style="padding:12px;border:1px solid #e0e0e0;">침실, 복도</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #e0e0e0;">40×50cm</td>
          <td style="padding:12px;border:1px solid #e0e0e0;">49,000원</td>
          <td style="padding:12px;border:1px solid #e0e0e0;">거실, 오피스</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #e0e0e0;">50×75cm</td>
          <td style="padding:12px;border:1px solid #e0e0e0;">69,000원</td>
          <td style="padding:12px;border:1px solid #e0e0e0;">거실 메인월</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size:13px;color:#999;margin-top:8px;">※ 배송비 무료 | 액자 포함 옵션은 공식 사이트에서 주문 가능</p>
  </div>

  <!-- 제품 특징 -->
  <div style="margin-bottom:32px;">
    <h2 style="font-size:18px;font-weight:600;margin-bottom:12px;">SILVERTAPE 아트프린트 특징</h2>
    <ul style="font-size:15px;line-height:2;color:#444;padding-left:20px;">
      <li><strong>프리미엄 아트지</strong> — 고급 무광 아트지에 고해상도 인쇄</li>
      <li><strong>한정판</strong> — 에디션 넘버링으로 소장 가치 보장</li>
      <li><strong>아카이벌 잉크</strong> — 100년 이상 변색 없는 아카이벌 잉크 사용</li>
      <li><strong>무료 배송</strong> — 안전 포장 후 무료 배송</li>
      <li><strong>인테리어 최적화</strong> — ${cat.mood} 공간 연출에 최적화된 작품</li>
    </ul>
  </div>

  <!-- SILVERTAPE 브랜드 -->
  <div style="background:#111;color:#fff;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
    <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">SILVERTAPE</h2>
    <p style="font-size:14px;color:#ccc;line-height:1.6;">
      Art Prints for Your Everyday Space<br/>
      일상의 공간을 갤러리로 — 실버테이프 아트프린트
    </p>
    <a href="${SITE_URL}/studio/hangover/${p.slug}"
       style="display:inline-block;margin-top:16px;padding:12px 32px;background:#fff;color:#111;text-decoration:none;border-radius:4px;font-weight:600;">
      ▶ 공식 사이트에서 자세히 보기
    </a>
  </div>

  <!-- SEO 텍스트 (검색 최적화) -->
  <div style="font-size:12px;color:#bbb;line-height:1.6;margin-top:24px;">
    <p>
      ${p.titleKo} ${p.title} | SILVERTAPE 실버테이프 아트프린트 포스터 |
      ${cat.style} 인테리어 액자 벽면 장식 | 거실 인테리어 소품 벽면 꾸미기 |
      ${koreanTags.join(' ')} | 고품질 프리미엄 아트 프린트 |
      카페 인테리어 오피스 인테리어 침실 인테리어 | 집들이 선물 기념일 선물 |
      모던 인테리어 감성 인테리어 | 한정판 에디션 아트워크
    </p>
  </div>

</div>`.trim();
}

const token = await getToken();
console.log('토큰 발급 완료\n');

// 등록 상품 조회
const searchRes = await fetch(`${BASE}/v1/products/search`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ productStatusTypes: ['SALE'], page: 1, size: 100 }),
});
const registered = (await searchRes.json()).contents || [];
console.log(`등록 상품: ${registered.length}개\n`);

let updated = 0, failed = 0, skipped = 0;

for (const item of registered) {
  const productNo = item.originProductNo;
  const channelName = item.channelProducts?.[0]?.name || '';
  const matched = products.find(p => p.title && channelName.includes(p.title));
  if (!matched) { skipped++; continue; }

  // GET 기존 상품
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
    console.log(`  ${matched.title} → originProduct 없음`);
    failed++;
    await new Promise(r => setTimeout(r, 500));
    continue;
  }

  const origin = existing.originProduct;

  // 기존 대표 이미지 URL 가져오기
  const existingImageUrl = origin.images?.representativeImage?.url || '';

  // 새 상세 HTML 생성
  const newDetailHtml = buildSeoDetailHtml(matched, existingImageUrl);

  // detailContent만 업데이트
  origin.detailContent = newDetailHtml;

  // PUT 업데이트
  const putRes = await fetch(`${BASE}/v2/products/origin-products/${productNo}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originProduct: origin,
      smartstoreChannelProduct: {
        channelProductName: origin.name,
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
      console.log(`  ✅ ${matched.title} → 상세설명 SEO 업데이트 완료`);
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
console.log(`✅ 상세설명 SEO 업데이트: ${updated}개`);
console.log(`❌ 실패: ${failed}개`);
console.log(`⏭️ 스킵: ${skipped}개`);

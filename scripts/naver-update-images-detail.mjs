/**
 * 네이버 상품 이미지 + 상세설명 일괄 업데이트
 * - 대표 이미지 → 블랙 프레임 목업
 * - 추가 이미지 → 화이트 프레임 목업
 * - 상세설명 → 감성 카피 + 가독성 강화 HTML
 *
 * 사용법:
 *   node scripts/naver-update-images-detail.mjs          → 전체 업데이트
 *   node scripts/naver-update-images-detail.mjs test     → 1개만 테스트
 *   node scripts/naver-update-images-detail.mjs detail   → 상세설명만 (이미지 스킵)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FRAMED_DIR = resolve(ROOT, 'public', 'images', 'framed');

// .env.local
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

// ── 이미지 업로드 ───────────────────────────────
async function uploadImage(token, filePath) {
  if (!existsSync(filePath)) {
    console.log(`    ⚠️ 이미지 없음: ${filePath}`);
    return null;
  }

  let imgBuffer = readFileSync(filePath);
  let fileName = filePath.split(/[/\\]/).pop();

  // 10MB 초과 시 압축
  if (imgBuffer.length > 9_500_000) {
    imgBuffer = await sharp(imgBuffer).jpeg({ quality: 70 }).toBuffer();
    fileName = fileName.replace(/\.\w+$/, '.jpg');
  }

  const mimeType = 'image/jpeg';
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
    console.log(`    ⚠️ 업로드 실패:`, JSON.stringify(data).slice(0, 200));
  } catch {
    console.log(`    ⚠️ 업로드 비정상 응답 (${res.status})`);
  }
  return null;
}

// ── 카테고리 데이터 ─────────────────────────────
const CATEGORY_DESC = {
  fine: { style: '파인아트', mood: '고급스러운 갤러리 감성', room: '거실, 서재, 오피스', adj: '깊은 질감과 감정의 울림' },
  pop: { style: '팝아트', mood: '감각적이고 트렌디한', room: '거실, 카페, 상업공간', adj: '대담한 색감과 에너지' },
  urban: { style: '어반아트', mood: '모던하고 세련된 도시 감성', room: '거실, 오피스, 카페', adj: '도시적 감각과 세련미' },
  fun: { style: '펀아트', mood: '유쾌하고 위트있는', room: '거실, 아이방, 카페', adj: '유쾌한 위트와 상상력' },
  minimal: { style: '미니멀아트', mood: '깔끔하고 심플한', room: '거실, 침실, 오피스', adj: '절제된 아름다움과 여백' },
  photo: { style: '포토아트', mood: '감성적인 풍경', room: '거실, 침실, 복도', adj: '빛과 순간을 담은 서정' },
  retro: { style: '레트로아트', mood: '빈티지하고 복고적인', room: '거실, 카페, 바', adj: '빈티지한 온기와 노스탤지어' },
  object: { style: '오브제아트', mood: '독특하고 예술적인', room: '거실, 서재, 갤러리', adj: '오브제적 조형미와 독창성' },
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

// ── 감성 상세설명 HTML 생성 ──────────────────────
function buildPremiumDetailHtml(p, blackFrameUrl, whiteFrameUrl) {
  const cat = CATEGORY_DESC[p.category] || CATEGORY_DESC.fine;
  const koreanTags = p.tags.map(t => TAG_KO[t]).filter(Boolean);
  const tagText = koreanTags.length > 0 ? koreanTags.join(' · ') : cat.style;

  return `
<div style="max-width:780px;margin:0 auto;padding:0;font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif;color:#1a1a1a;background:#fff;">

  <!-- ─── 히어로 섹션 ─── -->
  ${blackFrameUrl ? `
  <div style="text-align:center;padding:40px 20px 20px;">
    <img src="${blackFrameUrl}" alt="${p.titleKo} 블랙프레임 아트프린트" style="max-width:100%;border-radius:2px;"/>
  </div>` : ''}

  <!-- ─── 타이틀 ─── -->
  <div style="text-align:center;padding:24px 20px 16px;">
    <p style="font-size:13px;letter-spacing:4px;color:#999;margin:0 0 12px;">SILVERTAPE COLLECTION</p>
    <h1 style="font-size:28px;font-weight:700;margin:0 0 6px;line-height:1.3;">${p.titleKo}</h1>
    <p style="font-size:16px;color:#666;margin:0;font-style:italic;">${p.title}</p>
  </div>

  <!-- ─── 구분선 ─── -->
  <div style="width:40px;height:2px;background:#1a1a1a;margin:20px auto 32px;"></div>

  <!-- ─── 작품 이야기 ─── -->
  <div style="padding:0 24px 32px;">
    <p style="font-size:18px;line-height:2;color:#333;word-break:keep-all;">
      ${p.descriptionKo || `${cat.adj}이 담긴 작품입니다.`}
    </p>
    <p style="font-size:16px;line-height:1.9;color:#555;margin-top:16px;">
      당신의 공간에 걸리는 순간, <strong>${p.titleKo}</strong>은(는) 단순한 그림이 아닌 하나의 <strong>분위기</strong>가 됩니다.
      매일 마주하는 벽면이 갤러리가 되는 경험 — SILVERTAPE가 제안하는 아트 리빙입니다.
    </p>
  </div>

  ${whiteFrameUrl ? `
  <!-- ─── 화이트 프레임 이미지 ─── -->
  <div style="text-align:center;padding:0 20px 32px;">
    <img src="${whiteFrameUrl}" alt="${p.titleKo} 화이트프레임 아트프린트" style="max-width:100%;border-radius:2px;"/>
    <p style="font-size:13px;color:#aaa;margin-top:8px;">White Frame Option</p>
  </div>` : ''}

  <!-- ─── 스타일 태그 ─── -->
  <div style="text-align:center;padding:0 24px 32px;">
    <p style="font-size:14px;color:#888;letter-spacing:1px;">${tagText}</p>
  </div>

  <!-- ─── 인테리어 가이드 ─── -->
  <div style="background:#f8f7f5;padding:36px 28px;margin:0 0 32px;">
    <p style="font-size:13px;letter-spacing:3px;color:#999;margin:0 0 16px;">INTERIOR GUIDE</p>
    <h2 style="font-size:22px;font-weight:600;margin:0 0 16px;">이 작품이 어울리는 공간</h2>
    <p style="font-size:17px;line-height:2;color:#444;">
      <strong>${cat.mood}</strong> 분위기를 연출하는 이 작품은
      <strong>${cat.room}</strong> 등 다양한 공간에서 빛을 발합니다.
    </p>
    <p style="font-size:17px;line-height:2;color:#444;margin-top:12px;">
      단독으로 걸어 포인트 월을 만들거나, 여러 작품과 함께 갤러리 월을 구성해보세요.
      프레임 컬러(블랙/화이트/월넛)에 따라 전혀 다른 무드를 연출할 수 있습니다.
    </p>
  </div>

  <!-- ─── 사이즈 가이드 ─── -->
  <div style="padding:0 24px 36px;">
    <p style="font-size:13px;letter-spacing:3px;color:#999;margin:0 0 16px;">SIZE GUIDE</p>
    <h2 style="font-size:22px;font-weight:600;margin:0 0 20px;">사이즈 & 가격</h2>

    <div style="display:grid;gap:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#fafafa;border-radius:8px;">
        <div>
          <p style="font-size:17px;font-weight:600;margin:0;">20 × 30 cm</p>
          <p style="font-size:13px;color:#999;margin:4px 0 0;">책상 위, 선반, 침대 옆</p>
        </div>
        <p style="font-size:18px;font-weight:700;margin:0;">25,000원</p>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#fafafa;border-radius:8px;">
        <div>
          <p style="font-size:17px;font-weight:600;margin:0;">30 × 40 cm</p>
          <p style="font-size:13px;color:#999;margin:4px 0 0;">침실, 복도, 드레스룸</p>
        </div>
        <p style="font-size:18px;font-weight:700;margin:0;">35,000원</p>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#fafafa;border-radius:8px;border:2px solid #1a1a1a;">
        <div>
          <p style="font-size:17px;font-weight:600;margin:0;">40 × 50 cm <span style="font-size:12px;background:#1a1a1a;color:#fff;padding:2px 8px;border-radius:10px;margin-left:8px;">BEST</span></p>
          <p style="font-size:13px;color:#999;margin:4px 0 0;">거실, 오피스, 카페</p>
        </div>
        <p style="font-size:18px;font-weight:700;margin:0;">49,000원</p>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#fafafa;border-radius:8px;">
        <div>
          <p style="font-size:17px;font-weight:600;margin:0;">50 × 75 cm</p>
          <p style="font-size:13px;color:#999;margin:4px 0 0;">거실 메인월, 로비</p>
        </div>
        <p style="font-size:18px;font-weight:700;margin:0;">69,000원</p>
      </div>
    </div>
    <p style="font-size:14px;color:#999;margin-top:12px;text-align:center;">배송비 무료 · 액자 포함 옵션 별도</p>
  </div>

  <!-- ─── 프리미엄 품질 ─── -->
  <div style="padding:0 24px 36px;">
    <p style="font-size:13px;letter-spacing:3px;color:#999;margin:0 0 16px;">QUALITY</p>
    <h2 style="font-size:22px;font-weight:600;margin:0 0 20px;">프리미엄 아트 프린트</h2>

    <div style="display:grid;gap:16px;">
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <div style="min-width:44px;height:44px;background:#f5f4f2;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;">🖨</div>
        <div>
          <p style="font-size:17px;font-weight:600;margin:0 0 4px;">뮤지엄급 아트지</p>
          <p style="font-size:15px;color:#666;margin:0;line-height:1.6;">310gsm 무광 코튼 아트지에 12컬러 고해상도 인쇄. 미술관 납품과 동일한 스펙입니다.</p>
        </div>
      </div>
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <div style="min-width:44px;height:44px;background:#f5f4f2;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;">🎨</div>
        <div>
          <p style="font-size:17px;font-weight:600;margin:0 0 4px;">아카이벌 잉크</p>
          <p style="font-size:15px;color:#666;margin:0;line-height:1.6;">100년 이상 변색 없는 아카이벌 피그먼트 잉크. 오래 보아도 처음 그대로입니다.</p>
        </div>
      </div>
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <div style="min-width:44px;height:44px;background:#f5f4f2;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;">📦</div>
        <div>
          <p style="font-size:17px;font-weight:600;margin:0 0 4px;">안전 포장 & 무료 배송</p>
          <p style="font-size:15px;color:#666;margin:0;line-height:1.6;">하드보드 + 에어캡 이중 포장으로 안전하게 배송됩니다. 전국 무료 배송.</p>
        </div>
      </div>
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <div style="min-width:44px;height:44px;background:#f5f4f2;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;">✨</div>
        <div>
          <p style="font-size:17px;font-weight:600;margin:0 0 4px;">에디션 넘버링</p>
          <p style="font-size:15px;color:#666;margin:0;line-height:1.6;">각 프린트에 에디션 번호가 기재됩니다. 소장 가치가 있는 한정판 아트워크.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ─── 프레임 옵션 안내 ─── -->
  <div style="background:#f8f7f5;padding:36px 28px;margin:0 0 32px;">
    <p style="font-size:13px;letter-spacing:3px;color:#999;margin:0 0 16px;">FRAME OPTIONS</p>
    <h2 style="font-size:22px;font-weight:600;margin:0 0 16px;">프레임 선택 가이드</h2>
    <div style="display:grid;gap:12px;margin-top:20px;">
      <div style="display:flex;gap:12px;align-items:center;">
        <div style="width:32px;height:32px;background:linear-gradient(135deg,#2a2a2a,#111);border-radius:50%;flex-shrink:0;"></div>
        <div>
          <p style="font-size:16px;font-weight:600;margin:0;">블랙 프레임</p>
          <p style="font-size:14px;color:#777;margin:2px 0 0;">모던 & 시크한 공간에 추천</p>
        </div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;">
        <div style="width:32px;height:32px;background:linear-gradient(135deg,#fff,#ebe8e2);border-radius:50%;flex-shrink:0;border:1px solid #e0e0e0;"></div>
        <div>
          <p style="font-size:16px;font-weight:600;margin:0;">화이트 프레임</p>
          <p style="font-size:14px;color:#777;margin:2px 0 0;">밝고 깔끔한 공간에 추천</p>
        </div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;">
        <div style="width:32px;height:32px;background:linear-gradient(135deg,#6b432a,#3d250f);border-radius:50%;flex-shrink:0;"></div>
        <div>
          <p style="font-size:16px;font-weight:600;margin:0;">월넛 프레임</p>
          <p style="font-size:14px;color:#777;margin:2px 0 0;">따뜻하고 클래식한 공간에 추천</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ─── 브랜드 CTA ─── -->
  <div style="background:#111;color:#fff;padding:40px 28px;text-align:center;margin:0 0 24px;">
    <p style="font-size:12px;letter-spacing:4px;color:#888;margin:0 0 12px;">ART PRINTS FOR YOUR EVERYDAY SPACE</p>
    <h2 style="font-size:24px;font-weight:700;margin:0 0 8px;">SILVERTAPE</h2>
    <p style="font-size:15px;color:#aaa;line-height:1.7;margin:0 0 24px;">
      일상의 공간을 갤러리로 — 실버테이프 아트프린트
    </p>
    <a href="${SITE_URL}/studio/hangover/${p.slug}"
       style="display:inline-block;padding:14px 36px;background:#fff;color:#111;text-decoration:none;border-radius:4px;font-size:15px;font-weight:600;">
      공식 사이트에서 자세히 보기
    </a>
  </div>

  <!-- ─── SEO 텍스트 ─── -->
  <div style="font-size:11px;color:#ccc;line-height:1.5;padding:16px 24px;">
    ${p.titleKo} ${p.title} SILVERTAPE 실버테이프 아트프린트 포스터
    ${cat.style} 인테리어 액자 벽면 장식 거실 인테리어 소품 벽면 꾸미기
    ${koreanTags.join(' ')} 고품질 프리미엄 아트 프린트
    카페 인테리어 오피스 인테리어 침실 인테리어 집들이 선물 기념일 선물
    모던 인테리어 감성 인테리어 한정판 에디션 아트워크 인테리어 그림
  </div>

</div>`.trim();
}

// ── 상품 데이터 파싱 ─────────────────────────────
const productsSource = readFileSync(resolve(ROOT, 'src', 'data', 'products.ts'), 'utf-8');
const productBlocks = productsSource.split(/\n\s*\{[\s\n]*id:/g).slice(1);
const products = [];
const seenImages = new Set();

for (const block of productBlocks) {
  const get = (key) => {
    const m = block.match(new RegExp(`${key}:\\s*'([^']*)'`));
    return m ? m[1] : '';
  };
  const tagsMatch = block.match(/tags:\s*\[([^\]]*)\]/);
  const tags = tagsMatch
    ? tagsMatch[1].match(/'([^']*)'/g)?.map(t => t.replace(/'/g, '')) || []
    : [];
  const image = get('image');
  if (!image || seenImages.has(image)) continue;
  seenImages.add(image);
  products.push({
    slug: get('slug'),
    title: get('title'),
    titleKo: get('titleKo'),
    category: get('category'),
    descriptionKo: get('descriptionKo'),
    image,
    tags,
  });
}

// ── 실행 ─────────────────────────────────────────
const mode = process.argv[2]; // test | detail | undefined(전체)
const testMode = mode === 'test';
const detailOnly = mode === 'detail';

const token = await getToken();
console.log('토큰 발급 완료\n');

// 등록 상품 목록 조회
const searchRes = await fetch(`${BASE}/v1/products/search`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ productStatusTypes: ['SALE'], page: 1, size: 200 }),
});
const registered = (await searchRes.json()).contents || [];
console.log(`등록 상품: ${registered.length}개\n`);

let updated = 0, imgUpdated = 0, failed = 0, skipped = 0;
const items = testMode ? registered.slice(0, 1) : registered;

for (const item of items) {
  const productNo = item.originProductNo;
  const channelName = item.channelProducts?.[0]?.name || '';

  // products.ts에서 매칭
  const matched = products.find(p => p.title && channelName.includes(p.title));
  if (!matched) { skipped++; continue; }

  console.log(`\n── ${matched.titleKo || matched.title} ──`);

  // GET 기존 상품 정보
  const getRes = await fetch(`${BASE}/v2/products/origin-products/${productNo}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let existing;
  try { existing = JSON.parse(await getRes.text()); } catch {
    console.log(`  GET 실패`);
    failed++;
    await new Promise(r => setTimeout(r, 500));
    continue;
  }
  if (!existing.originProduct) {
    console.log(`  originProduct 없음`);
    failed++;
    await new Promise(r => setTimeout(r, 500));
    continue;
  }

  const origin = existing.originProduct;
  let blackUrl = null;
  let whiteUrl = null;

  // ── 이미지 업로드 (detailOnly가 아닐 때) ──
  if (!detailOnly) {
    const blackPath = resolve(FRAMED_DIR, `${matched.slug}-frame-black.jpg`);
    const whitePath = resolve(FRAMED_DIR, `${matched.slug}-frame-white.jpg`);

    if (existsSync(blackPath)) {
      console.log(`  블랙 프레임 업로드...`);
      blackUrl = await uploadImage(token, blackPath);
      await new Promise(r => setTimeout(r, 300));
    }
    if (existsSync(whitePath)) {
      console.log(`  화이트 프레임 업로드...`);
      whiteUrl = await uploadImage(token, whitePath);
      await new Promise(r => setTimeout(r, 300));
    }

    // 대표 이미지 교체 (블랙 프레임)
    if (blackUrl) {
      origin.images.representativeImage = { url: blackUrl };
      // 추가 이미지에 화이트 프레임 + 기존 대표 이미지
      const optionals = origin.images.optionalImages || [];
      const newOptionals = [];

      // 화이트 프레임을 첫 번째 추가 이미지로
      if (whiteUrl) {
        newOptionals.push({ url: whiteUrl });
      }
      // 기존 추가 이미지 유지 (중복 제거)
      for (const img of optionals) {
        if (img.url !== blackUrl && img.url !== whiteUrl) {
          newOptionals.push(img);
        }
      }
      origin.images.optionalImages = newOptionals.slice(0, 9); // 최대 9개
      imgUpdated++;
      console.log(`  ✅ 이미지 교체 완료 (블랙 대표 + 화이트 추가)`);
    }
  } else {
    // detailOnly: 기존 이미지 URL 가져오기
    blackUrl = origin.images?.representativeImage?.url || '';
    const optImgs = origin.images?.optionalImages || [];
    whiteUrl = optImgs.length > 0 ? optImgs[0].url : '';
  }

  // ── 상세설명 업데이트 ──
  const detailHtml = buildPremiumDetailHtml(
    matched,
    blackUrl || origin.images?.representativeImage?.url || '',
    whiteUrl || ''
  );
  origin.detailContent = detailHtml;

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
      console.log(`  ✅ 업데이트 완료`);
    } else {
      const err = putData.invalidInputs
        ? putData.invalidInputs.map(e => e.message).join(', ')
        : putData.message || '';
      console.log(`  ❌ ${err.slice(0, 150)}`);
      failed++;
    }
  } catch {
    console.log(`  ❌ 비정상 응답 (${putRes.status})`);
    failed++;
  }

  await new Promise(r => setTimeout(r, 600));
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅ 업데이트 성공: ${updated}개`);
console.log(`🖼️ 이미지 교체: ${imgUpdated}개`);
console.log(`❌ 실패: ${failed}개`);
console.log(`⏭️ 스킵 (매칭 없음): ${skipped}개`);

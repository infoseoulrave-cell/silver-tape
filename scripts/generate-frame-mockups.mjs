/**
 * 프레임 목업 이미지 생성기
 * sharp로 제품 이미지에 블랙/화이트 프레임 + 벽면 배경을 합성
 *
 * 사용법:
 *   node scripts/generate-frame-mockups.mjs            → 전체 생성
 *   node scripts/generate-frame-mockups.mjs test       → 1개만 테스트
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT_DIR = resolve(ROOT, 'public', 'images', 'framed');

// 출력 폴더 생성
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ── 디자인 토큰 (홈페이지 CSS 프레임 스타일 재현) ──
const CANVAS_W = 1200;
const CANVAS_H = 1200; // 1:1 정사각형 → 네이버에서 잘리지 않음

// 벽면 배경색 (밝은 오프화이트)
const WALL_COLOR = { r: 242, g: 240, b: 236, alpha: 1 };

// 프레임 설정 (홈페이지 CSS와 동일한 컬러)
const FRAME_CONFIGS = {
  black: {
    frameColor: '#1a1a1a',
    frameHighlight: '#333333',
    frameShadow: '#0a0a0a',
    matColor: '#fafafa',
  },
  white: {
    frameColor: '#f0ede7',
    frameHighlight: '#ffffff',
    frameShadow: '#d8d4cc',
    matColor: '#ffffff',
  },
};

// 프레임 두께 (홈페이지 대비 강조)
const FRAME_THICKNESS = 48;
const MAT_THICKNESS = 6; // 매트 최소화 — 프레임 바로 안쪽 얇은 립

/**
 * 프레임 목업 이미지 생성
 * @param {string} imagePath - 원본 이미지 경로
 * @param {'black'|'white'} frameType - 프레임 색상
 * @returns {Buffer} - JPEG 버퍼
 */
async function createFrameMockup(imagePath, frameType) {
  const config = FRAME_CONFIGS[frameType];

  // 1) 원본 이미지 로드 & 리사이즈
  const meta = await sharp(imagePath).metadata();

  // 프레임+립이 캔버스의 대부분을 차지하도록 (여백 최소)
  const MARGIN = 80; // 캔버스 가장자리 여백 (그림자 공간)
  const totalFrame = FRAME_THICKNESS + MAT_THICKNESS; // 프레임+립 합계

  const artMaxW = CANVAS_W - MARGIN * 2 - totalFrame * 2;
  const artMaxH = CANVAS_H - MARGIN * 2 - totalFrame * 2;

  // 비율 유지하면서 맞추기
  const artRatio = meta.width / meta.height;
  let artW, artH;
  if (artRatio > artMaxW / artMaxH) {
    artW = artMaxW;
    artH = Math.round(artMaxW / artRatio);
  } else {
    artH = artMaxH;
    artW = Math.round(artMaxH * artRatio);
  }

  const artBuffer = await sharp(imagePath)
    .resize(artW, artH, { fit: 'inside' })
    .toBuffer();

  // 2) 프레임 전체 크기 계산
  const frameInnerW = artW + MAT_THICKNESS * 2;
  const frameInnerH = artH + MAT_THICKNESS * 2;
  const frameOuterW = frameInnerW + FRAME_THICKNESS * 2;
  const frameOuterH = frameInnerH + FRAME_THICKNESS * 2;

  // 프레임 위치 (정중앙)
  const frameX = Math.round((CANVAS_W - frameOuterW) / 2);
  const frameY = Math.round((CANVAS_H - frameOuterH) / 2);

  // 3) SVG로 프레임 + 그림자 생성 (홈페이지 CSS 재현)
  const frameSvg = `
    <svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="4" dy="6" stdDeviation="16" flood-color="black" flood-opacity="0.5"/>
          <feDropShadow dx="1" dy="2" stdDeviation="4" flood-color="black" flood-opacity="0.3"/>
        </filter>
      </defs>

      <!-- 프레임 외곽 (box-shadow 재현) -->
      <rect x="${frameX}" y="${frameY}"
            width="${frameOuterW}" height="${frameOuterH}"
            fill="${config.frameColor}" filter="url(#shadow)" rx="0"/>

      <!-- 프레임 하이라이트 (top/left 밝은 테두리) -->
      <line x1="${frameX}" y1="${frameY}"
            x2="${frameX + frameOuterW}" y2="${frameY}"
            stroke="${config.frameHighlight}" stroke-width="1.5"/>
      <line x1="${frameX}" y1="${frameY}"
            x2="${frameX}" y2="${frameY + frameOuterH}"
            stroke="${config.frameHighlight}" stroke-width="1"/>

      <!-- 프레임 섀도우 (bottom/right 어두운 테두리) -->
      <line x1="${frameX}" y1="${frameY + frameOuterH}"
            x2="${frameX + frameOuterW}" y2="${frameY + frameOuterH}"
            stroke="${config.frameShadow}" stroke-width="1.5"/>
      <line x1="${frameX + frameOuterW}" y1="${frameY}"
            x2="${frameX + frameOuterW}" y2="${frameY + frameOuterH}"
            stroke="${config.frameShadow}" stroke-width="1"/>

      <!-- 안쪽 립 (innerLip inset shadow 재현) -->
      <rect x="${frameX + FRAME_THICKNESS}" y="${frameY + FRAME_THICKNESS}"
            width="${frameInnerW}" height="${frameInnerH}"
            fill="${config.matColor}"/>
      <rect x="${frameX + FRAME_THICKNESS}" y="${frameY + FRAME_THICKNESS}"
            width="${frameInnerW}" height="${frameInnerH}"
            fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>

      <!-- 유리 반사 효과 (글래스 샤인) -->
      <rect x="${frameX + FRAME_THICKNESS + MAT_THICKNESS}" y="${frameY + FRAME_THICKNESS + MAT_THICKNESS}"
            width="${artW}" height="${artH}"
            fill="url(#glassShine)" opacity="0.4"/>
      <defs>
        <linearGradient id="glassShine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(0,0,0,0.06)"/>
          <stop offset="15%" stop-color="rgba(0,0,0,0.03)"/>
          <stop offset="35%" stop-color="transparent"/>
          <stop offset="65%" stop-color="transparent"/>
          <stop offset="85%" stop-color="rgba(0,0,0,0.02)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.04)"/>
        </linearGradient>
      </defs>
    </svg>`;

  // 4) 레이어 합성
  const artX = frameX + FRAME_THICKNESS + MAT_THICKNESS;
  const artY = frameY + FRAME_THICKNESS + MAT_THICKNESS;

  const result = await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 3,
      background: WALL_COLOR,
    },
  })
    .composite([
      { input: Buffer.from(frameSvg), top: 0, left: 0 },
      { input: artBuffer, top: artY, left: artX },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  return result;
}

// ── 상품 데이터 로드 ──────────────────────────────
const productsSource = readFileSync(resolve(ROOT, 'src', 'data', 'products.ts'), 'utf-8');
const productBlocks = productsSource.split(/\n\s*\{[\s\n]*id:/g).slice(1);
const products = [];
const seenImages = new Set();

for (const block of productBlocks) {
  const get = (key) => {
    const m = block.match(new RegExp(`${key}:\\s*'([^']*)'`));
    return m ? m[1] : '';
  };
  const image = get('image');
  if (!image || seenImages.has(image)) continue;
  seenImages.add(image);
  products.push({
    slug: get('slug'),
    title: get('title'),
    image,
  });
}

// ── 실행 ─────────────────────────────────────────
const testMode = process.argv[2] === 'test';
const items = testMode ? products.slice(0, 1) : products;

console.log(`프레임 목업 생성: ${items.length}개 상품\n`);

let success = 0, fail = 0;

for (const product of items) {
  const fullPath = resolve(ROOT, 'public', product.image.replace(/^\//, ''));
  if (!existsSync(fullPath)) {
    console.log(`  ⚠️ ${product.title} — 이미지 없음`);
    fail++;
    continue;
  }

  try {
    // 블랙 프레임
    const blackBuffer = await createFrameMockup(fullPath, 'black');
    const blackName = `${product.slug}-frame-black.jpg`;
    writeFileSync(resolve(OUTPUT_DIR, blackName), blackBuffer);

    // 화이트 프레임
    const whiteBuffer = await createFrameMockup(fullPath, 'white');
    const whiteName = `${product.slug}-frame-white.jpg`;
    writeFileSync(resolve(OUTPUT_DIR, whiteName), whiteBuffer);

    const sizeKB = Math.round(blackBuffer.length / 1024);
    console.log(`  ✅ ${product.title} → ${blackName} (${sizeKB}KB), ${whiteName}`);
    success++;
  } catch (err) {
    console.log(`  ❌ ${product.title} — ${err.message}`);
    fail++;
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅ 생성: ${success}개 / ❌ 실패: ${fail}개`);
console.log(`📁 출력: public/images/framed/`);

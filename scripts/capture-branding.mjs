#!/usr/bin/env node
/**
 * Generate branding assets:
 *   1. favicon (32×32 PNG → ICO)
 *   2. apple-touch-icon (180×180 PNG)
 *   3. OG image (1200×630 PNG)
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/* ─── Helper: convert image to base64 data URI ─── */
function imgToBase64(filePath) {
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1);
  const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

/* ─── Helper: capture HTML → PNG ─── */
async function capture(browser, html, width, height, outPath) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });
  await page.screenshot({ path: outPath, type: 'png', omitBackground: false });
  await page.close();
  console.log(`  ✓ ${path.basename(outPath)} (${width}×${height})`);
}

/* ─── Simple PNG → ICO converter (single 32×32 image) ─── */
function pngToIco(pngPath, icoPath) {
  const png = fs.readFileSync(pngPath);
  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // reserved
  header.writeUInt16LE(1, 2);      // type: icon
  header.writeUInt16LE(1, 4);      // count: 1 image

  // ICO directory entry: 16 bytes
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);         // width
  entry.writeUInt8(32, 1);         // height
  entry.writeUInt8(0, 2);          // color palette
  entry.writeUInt8(0, 3);          // reserved
  entry.writeUInt16LE(1, 4);       // color planes
  entry.writeUInt16LE(32, 6);      // bits per pixel
  entry.writeUInt32LE(png.length, 8);  // image size
  entry.writeUInt32LE(22, 12);     // offset (6 + 16 = 22)

  fs.writeFileSync(icoPath, Buffer.concat([header, entry, png]));
}

/* ─── Favicon HTML (ST monogram) ─── */
function faviconHtml(size) {
  const fontSize = Math.round(size * 0.42);
  return `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${size}px; height: ${size}px;
    display: flex; align-items: center; justify-content: center;
    background: #111;
    font-family: 'Space Grotesk', system-ui, sans-serif;
  }
  .mark {
    color: #fff;
    font-size: ${fontSize}px;
    font-weight: 700;
    letter-spacing: ${Math.round(size * 0.02)}px;
    line-height: 1;
  }
</style>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
</head>
<body><div class="mark">ST</div></body></html>`;
}

/* ─── OG Image HTML ─── */
function ogImageHtml(heroBase64) {
  return `<!DOCTYPE html>
<html><head><style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Playfair+Display:ital@0;1&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    display: flex;
    background: #0a0a0a;
    font-family: 'Space Grotesk', sans-serif;
    overflow: hidden;
  }
  .left {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 60px 56px;
    position: relative;
    z-index: 2;
  }
  .logo-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 28px;
  }
  .logo-text {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #fff;
  }
  .tape-mark {
    width: 12px;
    height: 22px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tape-mark svg {
    fill: #d4af37;
  }
  .tagline {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 18px;
    color: rgba(255,255,255,0.5);
    margin-bottom: 36px;
    letter-spacing: 0.02em;
  }
  .title {
    font-size: 38px;
    font-weight: 700;
    color: #fff;
    line-height: 1.25;
    margin-bottom: 20px;
  }
  .desc {
    font-size: 16px;
    color: rgba(255,255,255,0.6);
    line-height: 1.7;
    max-width: 420px;
  }
  .url {
    margin-top: 32px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.35);
  }
  .right {
    width: 480px;
    position: relative;
    overflow: hidden;
  }
  .right img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .right::before {
    content: '';
    position: absolute;
    left: 0; top: 0;
    width: 120px;
    height: 100%;
    background: linear-gradient(to right, #0a0a0a, transparent);
    z-index: 1;
  }
  .accent-line {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #d4af37, transparent);
  }
</style></head>
<body>
  <div class="left">
    <div class="logo-row">
      <span class="logo-text">SILVER</span>
      <span class="tape-mark">
        <svg viewBox="0 0 14 24" width="12" height="22">
          <rect x="3" y="0" width="8" height="24" rx="1.5" transform="rotate(-14 7 12)" />
        </svg>
      </span>
      <span class="logo-text">TAPE</span>
    </div>
    <div class="tagline">Curated Art. Every Wall.</div>
    <div class="title">모든 벽에<br/>예술을.</div>
    <div class="desc">
      큐레이션 스튜디오가 엄선한 프리미엄 아트 프린트.<br/>
      당신의 공간을 갤러리로 만들어 드립니다.
    </div>
    <div class="url">silvertape.art</div>
  </div>
  <div class="right">
    <img src="${heroBase64}" />
  </div>
  <div class="accent-line"></div>
</body></html>`;
}

/* ─── Main ─── */
async function main() {
  console.log('🎨 Generating branding assets...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // 1. Favicon 32×32
  console.log('[1/4] Favicon 32×32');
  const favicon32Path = path.join(ROOT, 'src/app/icon.png');
  await capture(browser, faviconHtml(32), 32, 32, favicon32Path);

  // 2. Convert to ICO
  console.log('[2/4] favicon.ico');
  const faviconIcoPath = path.join(ROOT, 'src/app/favicon.ico');
  pngToIco(favicon32Path, faviconIcoPath);
  console.log(`  ✓ favicon.ico`);

  // 3. Apple touch icon 180×180
  console.log('[3/4] Apple touch icon 180×180');
  const applePath = path.join(ROOT, 'src/app/apple-icon.png');
  await capture(browser, faviconHtml(180), 180, 180, applePath);

  // 4. OG Image 1200×630
  console.log('[4/4] OG Image 1200×630');
  const heroPath = path.join(ROOT, 'public/images/products/sensibility/sens-001-art.png');
  const heroBase64 = imgToBase64(heroPath);
  const ogPath = path.join(ROOT, 'public/og-image.png');
  await capture(browser, ogImageHtml(heroBase64), 1200, 630, ogPath);

  await browser.close();
  console.log('\n✅ All branding assets generated!');
}

main().catch(err => { console.error(err); process.exit(1); });

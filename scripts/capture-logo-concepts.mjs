#!/usr/bin/env node
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public/logo-concepts');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

async function capture(browser, html, w, h, outPath) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });
  await page.screenshot({ path: outPath, type: 'png', omitBackground: false });
  await page.close();
}

const fonts = `<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=DM+Serif+Display&family=Syne:wght@400;500;600;700;800&family=Unbounded:wght@300;400;500;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">`;

const base = (inner) => `<!DOCTYPE html><html><head>${fonts}
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:800px; height:400px; display:flex; align-items:center; justify-content:center; overflow:hidden; }
</style></head><body>${inner}</body></html>`;

const CONCEPTS = [
  // 1. Minimalist Serif — 우아한 세리프 + 얇은 테이프 라인
  {
    name: '01-minimal-serif',
    desc: 'Minimalist Serif + Gold Line',
    html: base(`<style>
      body { background: #fafaf8; flex-direction: column; gap: 6px; }
      .logo { display:flex; align-items:center; gap:0; }
      .s { font-family:'Cormorant Garamond',serif; font-size:52px; font-weight:300; letter-spacing:0.22em; color:#1a1a1a; }
      .tape { width:36px; height:2px; background:linear-gradient(90deg,#c9a84c,#e8d48b,#c9a84c); margin:0 6px; transform:rotate(-8deg); }
      .sub { font-family:'Cormorant Garamond',serif; font-size:11px; letter-spacing:0.35em; color:#999; font-weight:400; text-transform:uppercase; }
    </style>
    <div class="logo"><span class="s">SILVER</span><span class="tape"></span><span class="s">TAPE</span></div>
    <div class="sub">Curated Art for Every Wall</div>`)
  },

  // 2. Bold Geometric — 두꺼운 산세리프 + 각진 테이프 블록
  {
    name: '02-bold-geometric',
    desc: 'Bold Geometric Block',
    html: base(`<style>
      body { background: #0a0a0a; }
      .wrap { display:flex; align-items:center; gap:0; }
      .txt { font-family:'Syne',sans-serif; font-size:56px; font-weight:800; letter-spacing:0.08em; color:#fff; }
      .block { width:14px; height:52px; background:#d4af37; margin:0 8px; transform:rotate(-12deg); border-radius:2px; }
    </style>
    <div class="wrap"><span class="txt">SILVER</span><span class="block"></span><span class="txt">TAPE</span></div>`)
  },

  // 3. Stacked Elegant — 위아래 2단 + 중앙 테이프 마크
  {
    name: '03-stacked-elegant',
    desc: 'Stacked Layout + Center Tape',
    html: base(`<style>
      body { background: #f5f0eb; flex-direction:column; gap:0; }
      .top { font-family:'DM Serif Display',serif; font-size:58px; font-weight:400; letter-spacing:0.18em; color:#1a1a1a; line-height:1; }
      .mid { display:flex; align-items:center; gap:16px; margin:10px 0; }
      .line { width:80px; height:1px; background:#c9a84c; }
      .mark { width:10px; height:18px; background:#c9a84c; transform:rotate(-14deg); border-radius:2px; }
      .bot { font-family:'DM Serif Display',serif; font-size:58px; font-weight:400; letter-spacing:0.18em; color:#1a1a1a; line-height:1; }
    </style>
    <div class="top">SILVER</div>
    <div class="mid"><span class="line"></span><span class="mark"></span><span class="line"></span></div>
    <div class="bot">TAPE</div>`)
  },

  // 4. Monogram Badge — ST 모노그램 원형 뱃지
  {
    name: '04-monogram-badge',
    desc: 'ST Monogram Circle Badge',
    html: base(`<style>
      body { background: #1a1a1a; flex-direction:column; gap:24px; }
      .badge { width:160px; height:160px; border-radius:50%; border:2px solid #d4af37; display:flex; align-items:center; justify-content:center; position:relative; }
      .st { font-family:'Cormorant Garamond',serif; font-size:64px; font-weight:600; color:#fff; letter-spacing:0.05em; }
      .tape-line { position:absolute; width:3px; height:40px; background:#d4af37; transform:rotate(-14deg); right:52px; top:50px; border-radius:2px; }
      .name { font-family:'Space Grotesk',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.35em; color:#888; text-transform:uppercase; }
    </style>
    <div class="badge"><span class="st">ST</span><span class="tape-line"></span></div>
    <div class="name">Silvertape</div>`)
  },

  // 5. Tape Strip — 사선 테이프 위에 텍스트
  {
    name: '05-tape-strip',
    desc: 'Diagonal Tape Strip',
    html: base(`<style>
      body { background: #f8f8f6; }
      .wrap { position:relative; padding:20px 60px; }
      .strip { position:absolute; inset:0; background:linear-gradient(135deg,#e8d48b,#c9a84c); transform:rotate(-3deg); border-radius:3px; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
      .txt { position:relative; z-index:1; font-family:'Space Grotesk',sans-serif; font-size:44px; font-weight:700; letter-spacing:0.14em; color:#1a1a1a; }
    </style>
    <div class="wrap"><div class="strip"></div><span class="txt">SILVERTAPE</span></div>`)
  },

  // 6. Split Vertical — 세로선 분리 + 이탤릭 서브
  {
    name: '06-split-vertical',
    desc: 'Vertical Split + Italic Sub',
    html: base(`<style>
      body { background: #fff; flex-direction:column; gap:12px; }
      .row { display:flex; align-items:center; gap:0; }
      .s { font-family:'Space Grotesk',sans-serif; font-size:48px; font-weight:700; letter-spacing:0.15em; color:#111; }
      .div { width:2px; height:40px; background:#d4af37; margin:0 16px; }
      .sub { font-family:'Playfair Display',serif; font-style:italic; font-size:15px; color:#888; letter-spacing:0.04em; }
    </style>
    <div class="row"><span class="s">SILVER</span><span class="div"></span><span class="s">TAPE</span></div>
    <div class="sub">Curated Art. Every Wall.</div>`)
  },

  // 7. Brutalist Raw — 거친 브루탈리즘 + 굵은 테이프
  {
    name: '07-brutalist',
    desc: 'Brutalist Heavy Weight',
    html: base(`<style>
      body { background: #e8e4de; }
      .wrap { display:flex; flex-direction:column; align-items:flex-start; }
      .row { display:flex; align-items:baseline; gap:0; }
      .txt { font-family:'Unbounded',sans-serif; font-size:52px; font-weight:700; letter-spacing:-0.01em; color:#111; line-height:1; }
      .tape { display:inline-block; width:48px; height:8px; background:#111; margin:0 6px 4px; transform:rotate(-10deg); }
      .under { width:100%; height:4px; background:#111; margin-top:8px; }
    </style>
    <div class="wrap">
      <div class="row"><span class="txt">SILVER</span><span class="tape"></span><span class="txt">TAPE</span></div>
      <div class="under"></div>
    </div>`)
  },

  // 8. Gallery Frame — 프레임 안에 로고
  {
    name: '08-gallery-frame',
    desc: 'Gallery Frame Enclosed',
    html: base(`<style>
      body { background: #fafaf8; flex-direction:column; gap:0; }
      .frame { border:1.5px solid #1a1a1a; padding:28px 52px 24px; display:flex; flex-direction:column; align-items:center; gap:6px; }
      .top { font-family:'Cormorant Garamond',serif; font-size:11px; font-weight:600; letter-spacing:0.4em; color:#999; text-transform:uppercase; }
      .main { font-family:'DM Serif Display',serif; font-size:46px; color:#1a1a1a; letter-spacing:0.12em; line-height:1; display:flex; align-items:center; gap:0; }
      .mark { display:inline-block; width:8px; height:16px; background:#c9a84c; transform:rotate(-14deg); margin:0 6px; border-radius:1px; }
      .bot { font-family:'Cormorant Garamond',serif; font-size:10px; letter-spacing:0.5em; color:#999; margin-top:2px; }
    </style>
    <div class="frame">
      <div class="top">Est. 2025</div>
      <div class="main">SILVER<span class="mark"></span>TAPE</div>
      <div class="bot">CURATED ART FOR EVERY WALL</div>
    </div>`)
  },

  // 9. Negative Space — 테이프 마크 안에 역방향 텍스트
  {
    name: '09-negative-space',
    desc: 'Wide Tape Negative Space',
    html: base(`<style>
      body { background: #111; flex-direction:column; gap:16px; }
      .row { display:flex; align-items:center; gap:12px; }
      .silver { font-family:'Space Grotesk',sans-serif; font-size:42px; font-weight:300; letter-spacing:0.2em; color:rgba(255,255,255,0.4); }
      .tape-box { background:#d4af37; padding:8px 20px; transform:rotate(-2deg); border-radius:2px; }
      .tape-txt { font-family:'Space Grotesk',sans-serif; font-size:42px; font-weight:700; letter-spacing:0.2em; color:#111; }
      .sub { font-family:'Playfair Display',serif; font-style:italic; font-size:13px; color:rgba(255,255,255,0.3); letter-spacing:0.1em; }
    </style>
    <div class="row"><span class="silver">SILVER</span><span class="tape-box"><span class="tape-txt">TAPE</span></span></div>
    <div class="sub">Every wall deserves a sensation</div>`)
  },

  // 10. Luxe Minimal — 울트라 미니멀 럭셔리
  {
    name: '10-luxe-minimal',
    desc: 'Ultra Minimal Luxury',
    html: base(`<style>
      body { background: #0d0d0d; flex-direction:column; gap:20px; }
      .logo { display:flex; align-items:center; gap:14px; }
      .txt { font-family:'Instrument Serif',serif; font-size:54px; font-weight:400; color:#f0ece4; letter-spacing:0.18em; }
      .dot { width:6px; height:6px; border-radius:50%; background:#c9a84c; }
      .line { width:100px; height:0.5px; background:linear-gradient(90deg,transparent,#c9a84c,transparent); }
      .sub { font-family:'Space Grotesk',sans-serif; font-size:10px; font-weight:500; letter-spacing:0.5em; color:#555; text-transform:uppercase; }
    </style>
    <div class="logo"><span class="txt">SILVER</span><span class="dot"></span><span class="txt">TAPE</span></div>
    <div class="line"></div>
    <div class="sub">Curated Art &middot; Every Wall</div>`)
  },
];

async function main() {
  console.log('🎨 Generating 10 logo concepts...\n');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  for (const c of CONCEPTS) {
    const out = path.join(OUT, `${c.name}.png`);
    await capture(browser, c.html, 800, 400, out);
    console.log(`  ✓ ${c.name} — ${c.desc}`);
  }

  await browser.close();
  console.log(`\n✅ 10 logo concepts saved to public/logo-concepts/`);
}

main().catch(e => { console.error(e); process.exit(1); });

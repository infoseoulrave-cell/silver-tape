import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pub = (p) => path.join(root, 'public', p);

const WIDTH = 1200;
const HEIGHT = 630;
const BG_COLOR = { r: 240, g: 238, b: 235, alpha: 1 }; // warm off-white wall
const FRAME_COLOR = '#1a1a1a';
const FRAME_WIDTH = 3;
const SHADOW_OFFSET = 4;
const SHADOW_COLOR = 'rgba(0,0,0,0.15)';

// Artworks: top row (larger) + bottom row (smaller) — salon-style 2-row gallery
const ARTWORKS = [
  // Top row — 5 pieces
  { src: 'images/products/art/art-001-art.webp', w: 150, h: 200 },       // Midnight
  { src: 'images/products/sensibility/sens-001-art.png', w: 180, h: 225 }, // Irrational Table (hero)
  { src: 'images/products/art/art-003-art.webp', w: 155, h: 207 },       // Head in the Clouds
  { src: 'images/products/sensibility/sens-002-art.png', w: 150, h: 188 }, // Golden Shadows
  { src: 'images/gallery-strip/strip-5.jpg', w: 155, h: 213 },           // Cactus Symphony
  // Bottom row — 4 smaller pieces
  { src: 'images/products/art/art-002-art.webp', w: 110, h: 155 },       // The Botanist
  { src: 'images/gallery-strip/strip-7.jpg', w: 120, h: 165 },           // Salt Walker
  { src: 'images/products/sensibility/sens-005-art.png', w: 115, h: 145 }, // Film Walker
  { src: 'images/products/art/art-005-art.webp', w: 110, h: 148 },       // Summertime
];

// 2-row salon hang — centered, staggered
const POSITIONS = [
  // Top row — y ~30-60, spread across width
  { x: 55,  y: 35 },
  { x: 235, y: 15 },
  { x: 445, y: 40 },
  { x: 630, y: 25 },
  { x: 810, y: 15 },
  // Bottom row — y ~290-320, offset from top
  { x: 155, y: 300 },
  { x: 390, y: 285 },
  { x: 620, y: 305 },
  { x: 845, y: 290 },
];

async function createFramedArtwork(src, targetW, targetH) {
  const fw = FRAME_WIDTH;
  const totalW = targetW + fw * 2;
  const totalH = targetH + fw * 2;

  // Resize artwork
  const artwork = await sharp(pub(src))
    .resize(targetW, targetH, { fit: 'cover' })
    .toBuffer();

  // Create frame (dark border around artwork)
  const framed = await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: FRAME_COLOR,
    }
  })
    .composite([
      { input: artwork, left: fw, top: fw },
    ])
    .png()
    .toBuffer();

  return { buffer: framed, width: totalW, height: totalH };
}

async function createShadow(w, h) {
  return sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 40 },
    }
  })
    .blur(3)
    .png()
    .toBuffer();
}

async function main() {
  console.log('Generating OG image with real artworks...');

  // Prepare all framed artworks
  const composites = [];

  for (let i = 0; i < ARTWORKS.length; i++) {
    const art = ARTWORKS[i];
    const pos = POSITIONS[i];
    const framed = await createFramedArtwork(art.src, art.w, art.h);

    // Shadow layer (offset below/right)
    const shadow = await createShadow(framed.width, framed.height);
    composites.push({
      input: shadow,
      left: pos.x + SHADOW_OFFSET,
      top: pos.y + SHADOW_OFFSET,
    });

    // Framed artwork
    composites.push({
      input: framed.buffer,
      left: pos.x,
      top: pos.y,
    });
  }

  // Add SILVERTAPE logo text at bottom center using SVG
  const logoSvg = Buffer.from(`
    <svg width="300" height="40" xmlns="http://www.w3.org/2000/svg">
      <text x="150" y="28" font-family="Helvetica, Arial, sans-serif"
            font-size="16" font-weight="700" letter-spacing="8"
            fill="#1a1a1a" text-anchor="middle" opacity="0.7">SILVERTAPE</text>
    </svg>
  `);

  composites.push({
    input: logoSvg,
    left: Math.floor((WIDTH - 300) / 2),
    top: HEIGHT - 55,
  });

  // Tagline
  const taglineSvg = Buffer.from(`
    <svg width="400" height="24" xmlns="http://www.w3.org/2000/svg">
      <text x="200" y="16" font-family="Georgia, serif"
            font-size="11" font-style="italic"
            fill="#666666" text-anchor="middle" opacity="0.8">Curated Art Prints for Your Wall</text>
    </svg>
  `);

  composites.push({
    input: taglineSvg,
    left: Math.floor((WIDTH - 400) / 2),
    top: HEIGHT - 32,
  });

  // Create final image
  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: BG_COLOR,
    }
  })
    .composite(composites)
    .png({ quality: 90 })
    .toFile(pub('og-image.png'));

  console.log('Done! Saved to public/og-image.png');
}

main().catch(console.error);

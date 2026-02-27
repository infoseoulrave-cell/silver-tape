#!/usr/bin/env node
/**
 * Generate SILVERTAPE logo v3 — creative concepts
 */
import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'logo-concepts');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const PROMPTS = [
  // 1. 미니멀 — 검정 배경에 덕테이프 한 줄, 글씨 없음
  {
    name: '21-pure-tape-black',
    prompt: 'A single horizontal strip of real silver duct tape centered on a pure black background. No text, no writing, nothing on the tape. Just the tape itself — realistic metallic silver surface with authentic woven fabric texture, subtle wrinkles, torn rough edges on both sides. The tape catches dramatic studio side-lighting creating bright specular highlights and deep shadows on its textured surface. Minimalist, clean composition. Photorealistic product photography, 8k quality.',
    w: 1440, h: 560,
  },
  // 2. 미니멀 — 흰 배경에 덕테이프 한 줄, 글씨 없음
  {
    name: '22-pure-tape-white',
    prompt: 'A single horizontal strip of real silver duct tape centered on a pure white background. No text, no writing. The tape has authentic metallic silver duct tape texture — woven fabric pattern, natural creases, reflective surface, torn rough edges on left and right. Soft diffused studio lighting from above. Ultra minimalist composition, the tape is the only element. Photorealistic, clean white product photography, 8k.',
    w: 1440, h: 560,
  },
  // 3. 바나나 — 마우리치오 카텔란 오마주, 덕테이프로 바나나 붙이기
  {
    name: '23-banana-tape',
    prompt: 'A single yellow banana duct-taped to a plain white gallery wall with a strip of silver metallic duct tape, in the style of Maurizio Cattelan\'s Comedian. The silver duct tape crosses diagonally over the banana. Clean white gallery wall, dramatic museum lighting from above casting a subtle shadow. The banana is fresh and yellow, the tape is shiny silver with realistic texture. Contemporary art installation photography, minimal, sophisticated, 8k quality.',
    w: 1024, h: 1024,
  },
  // 4. 갤러리 벽 — 빈 흰 벽에 덕테이프 X 표시 (전시 준비중 느낌)
  {
    name: '24-gallery-x-mark',
    prompt: 'Two strips of silver duct tape forming an X mark on a pristine white gallery wall. The tape strips cross each other diagonally. No other elements — just the empty white wall and the silver tape X. Museum lighting creates subtle shadows. The tape has realistic metallic texture with wrinkles and reflections. Minimalist contemporary art gallery setting. The image suggests something was here, or something is about to be hung. Conceptual, clean, photorealistic, 8k.',
    w: 1024, h: 1024,
  },
  // 5. 액자 — 덕테이프로 빈 액자를 벽에 붙여놓은 모습
  {
    name: '25-taped-frame',
    prompt: 'An empty black picture frame hanging on a white wall, held up by two strips of silver duct tape at the top corners instead of proper hanging hardware. The frame is slightly tilted. Inside the frame is just the white wall — nothing displayed. The silver duct tape strips are realistic with metallic texture and torn edges. Art gallery humor, anti-establishment art aesthetic. Clean composition, warm gallery lighting, photorealistic photography, 8k.',
    w: 1024, h: 1024,
  },
];

async function generate(prompt, w, h, outPath) {
  console.log(`  ⏳ Generating...`);
  const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
    input: { prompt, width: w, height: h, prompt_upsampling: true, safety_tolerance: 5 },
  });

  let imageUrl = typeof output === 'string' ? output :
    Array.isArray(output) ? String(output[0]) : String(output);
  if (typeof imageUrl === 'object' && imageUrl.url) imageUrl = imageUrl.url();

  const res = await fetch(String(imageUrl));
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  console.log(`  ✓ Saved (${Math.round(buffer.length / 1024)}KB)`);
}

async function main() {
  console.log('\n🎨 Generating v3 — creative logo concepts...\n');
  for (const p of PROMPTS) {
    const outPath = path.join(OUT, `${p.name}.webp`);
    console.log(`[${p.name}]`);
    try { await generate(p.prompt, p.w, p.h, outPath); }
    catch (err) { console.error(`  ✗ ${err.message}`); }
  }
  console.log('\n✅ Done!\n');
}

main().catch(e => { console.error(e); process.exit(1); });

#!/usr/bin/env node
/**
 * Generate SILVERTAPE logo v2 — horizontal tape strip, elegant handwriting
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
  {
    name: '17-tape-strip-elegant',
    prompt: 'A single horizontal strip of silver duct tape on a pure black background. The tape has realistic metallic silver texture with subtle wrinkles and light reflections, torn edges on both sides. Written on the tape in elegant black calligraphy handwriting: "SILVER TAPE". The lettering is stylish, confident, slightly artistic italic script — like a fashion brand logo written by hand with a fine brush pen. Clean horizontal composition, dramatic studio lighting from above. Photorealistic, 8k.',
  },
  {
    name: '18-tape-strip-brush',
    prompt: 'A horizontal strip of realistic silver metallic duct tape centered on a dark charcoal background. The tape surface shows authentic duct tape texture — woven fabric pattern, metallic sheen, slight wrinkles. On the tape, elegant black brush calligraphy reads "SILVER TAPE" in a sophisticated hand-lettered style, like high-end fashion branding. The letters are refined but with natural brush stroke character. Straight horizontal tape, torn rough edges on left and right. Product photography lighting.',
  },
  {
    name: '19-tape-strip-minimal',
    prompt: 'Minimalist photograph: a perfectly horizontal strip of silver duct tape across the center of a pure white background. The tape has photorealistic metallic texture with natural creases and reflective highlights. Written on it in black ink with beautiful modern calligraphy: "SILVERTAPE" as one word. The handwriting is elegant, flowing, like luxury brand lettering — thin and thick stroke variation, artistic but readable. Clean, minimal, high-end product photography.',
  },
  {
    name: '20-tape-strip-dark',
    prompt: 'A horizontal torn strip of silver duct tape floating on a solid black background. Realistic metallic surface catching dramatic side light, showing authentic tape texture and subtle wrinkles. The text "SILVER TAPE" is written in sophisticated black ink lettering — a refined hand-drawn logotype style between calligraphy and typography, like a luxury streetwear brand mark. The letters have character and elegance, not rough or messy. Centered composition, high contrast, photorealistic studio shot.',
  },
];

async function generate(prompt, outPath) {
  console.log(`  ⏳ Generating...`);
  const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
    input: {
      prompt,
      width: 1440,
      height: 560,
      prompt_upsampling: true,
      safety_tolerance: 5,
    },
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
  console.log('\n🎨 Generating v2 — horizontal tape strip + elegant lettering...\n');
  for (const p of PROMPTS) {
    const outPath = path.join(OUT, `${p.name}.webp`);
    console.log(`[${p.name}]`);
    try { await generate(p.prompt, outPath); }
    catch (err) { console.error(`  ✗ ${err.message}`); }
  }
  console.log('\n✅ Done!\n');
}

main().catch(e => { console.error(e); process.exit(1); });

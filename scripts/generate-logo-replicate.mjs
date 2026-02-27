#!/usr/bin/env node
/**
 * Generate SILVERTAPE logo using Replicate AI
 * Realistic silver duct tape with handwritten text
 */
import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'logo-concepts');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const PROMPTS = [
  {
    name: '13-silver-tape-handwritten',
    prompt: 'A single strip of real silver duct tape placed horizontally on a pure white background. The tape has realistic wrinkles, creases, and reflective metallic silver surface texture. Written on top of the tape in black hand-drawn marker letters: "SILVERTAPE". The handwriting is casual, artistic, slightly imperfect brush-pen style. Clean minimal composition, studio product photography lighting. Photorealistic, 8k quality.',
    negative: 'gold, yellow, colored tape, multiple tapes, busy background, text outside tape, computer font, perfect letters, digital text',
  },
  {
    name: '14-torn-tape-logo',
    prompt: 'Close-up photograph of a torn piece of silver metallic duct tape on a matte black surface. The tape is slightly crumpled with realistic light reflections on its metallic surface. Written across the tape in bold black hand-painted brush strokes: "SILVER TAPE" (two words). The handwriting style is raw, artistic, like street art calligraphy. Dramatic side lighting emphasizing the tape texture. Photorealistic studio photography.',
    negative: 'gold, yellow, clean tape, flat tape, computer generated text, digital font, serif font, sans-serif font',
  },
  {
    name: '15-tape-on-wall',
    prompt: 'A strip of shiny silver duct tape stuck diagonally on a raw concrete wall. On the tape, someone has written "SILVERTAPE" in black permanent marker with confident hand lettering. The tape catches light creating bright specular highlights on its metallic surface. Authentic urban feel, documentary photography style, natural lighting. The concrete texture provides beautiful contrast to the reflective tape.',
    negative: 'gold tape, yellow, clean white background, digital text, computer font, multiple tapes, colorful',
  },
  {
    name: '16-tape-roll-logo',
    prompt: 'Overhead flat-lay photograph of a partially unrolled silver duct tape roll on a dark slate surface. The unrolled section extends to the right with "SILVER TAPE" written on it in black brush pen calligraphy, artistic and expressive handwriting. The metallic tape surface shows realistic wrinkles and light reflections. Minimal product photography, soft studio lighting from above.',
    negative: 'gold, yellow tape, messy background, digital text, perfect computer font, colorful elements',
  },
];

async function generate(prompt, negativePr, outPath) {
  console.log(`  ⏳ Generating...`);

  const output = await replicate.run(
    'black-forest-labs/flux-1.1-pro',
    {
      input: {
        prompt: prompt,
        width: 1440,
        height: 720,
        prompt_upsampling: true,
        safety_tolerance: 5,
      },
    }
  );

  // output is a URL or ReadableStream depending on model
  let imageUrl;
  if (typeof output === 'string') {
    imageUrl = output;
  } else if (output && output.url) {
    imageUrl = output.url();
  } else if (Array.isArray(output)) {
    imageUrl = output[0];
    if (typeof imageUrl === 'object' && imageUrl.url) imageUrl = imageUrl.url();
  } else {
    imageUrl = output;
  }

  // Download the image
  const response = await fetch(String(imageUrl));
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outPath, buffer);

  const sizeKB = Math.round(buffer.length / 1024);
  console.log(`  ✓ Saved (${sizeKB}KB)`);
}

async function main() {
  console.log('\n🎨 Generating silver duct tape logos via Replicate (Flux 1.1 Pro)...\n');

  for (const p of PROMPTS) {
    const outPath = path.join(OUT, `${p.name}.webp`);
    console.log(`[${p.name}]`);
    try {
      await generate(p.prompt, p.negative, outPath);
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
    }
  }

  console.log(`\n✅ Done! Logo concepts saved to public/logo-concepts/\n`);
}

main().catch(e => { console.error(e); process.exit(1); });

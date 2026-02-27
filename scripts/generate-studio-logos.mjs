#!/usr/bin/env node
/**
 * Generate studio logos for SILVERTAPE's 4 studios via Replicate (Flux 1.1 Pro)
 *
 * Each logo reflects the studio's identity:
 * - HANGOVER: Graphic excess, bold, raw energy
 * - VOID.: Minimalist contemplation, clean negative space
 * - SENSIBILITY STAIR: Contrast, materiality, sharp senses
 * - PHANTOM REEL: Vintage film, surreal found footage
 */
import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'images', 'studios');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const LOGOS = [
  {
    name: 'hangover',
    prompt: `Minimal typographic logo design for an art studio called "HANGOVER". The word HANGOVER in bold condensed sans-serif uppercase letters, slightly distressed like a worn-out neon sign or nightclub stamp. Dark charcoal gray text on pure black background. The letters have a subtle metallic silver sheen. Raw, gritty, graphic poster aesthetic — like it belongs on a gallery wall. No icons, no decorations, just pure bold typography. Professional logo design, vector-clean edges, 8k.`,
    w: 1024, h: 1024,
  },
  {
    name: 'void',
    prompt: `Ultra-minimal typographic logo design for an art studio called "VOID." (with a period). The word VOID. in thin, elegant, widely-spaced uppercase letters. Soft gray (#A0A0B0) text on pure white background. Extreme negative space around the text. The typography is ethereal, almost disappearing — contemplative minimalism. Clean, architectural, modern. Think Helmut Lang meets gallery identity. No icons, no decorations, just pristine typography floating in white space. Professional logo design, 8k.`,
    w: 1024, h: 1024,
  },
  {
    name: 'sensibility',
    prompt: `Modern typographic logo design for an art studio called "SENSIBILITY STAIR". The text is arranged in two lines — "SENSIBILITY" on top, "STAIR" below, right-aligned. Bold geometric sans-serif typeface. Deep vermillion red (#E63B2E) text on pure white background. The letters have sharp precise edges — emphasizing contrast and visual tension. A single thin diagonal line cuts across subtly behind the text. Clean, graphic, contemporary gallery aesthetic. No icons beyond the line. Professional logo design, 8k.`,
    w: 1024, h: 1024,
  },
  {
    name: 'phantom-reel',
    prompt: `Vintage-inspired typographic logo design for a photography studio called "PHANTOM REEL". The text in slightly condensed serif typeface, uppercase. Teal/dark cyan (#2A6B7C) text on an aged off-white/cream background with very subtle film grain texture. The typography feels like it was printed on old photographic paper — slightly faded, nostalgic, analog. Think vintage film title cards from the 1960s. "PHANTOM" on top, "REEL" below. No icons, just beautiful vintage typography. Professional logo design, 8k.`,
    w: 1024, h: 1024,
  },
];

async function generate(prompt, w, h, outPath) {
  console.log(`  Generating...`);
  const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
    input: { prompt, width: w, height: h, prompt_upsampling: true, safety_tolerance: 5 },
  });

  let imageUrl = typeof output === 'string' ? output :
    Array.isArray(output) ? String(output[0]) : String(output);
  if (typeof imageUrl === 'object' && imageUrl.url) imageUrl = imageUrl.url();

  const res = await fetch(String(imageUrl));
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  console.log(`  Saved (${Math.round(buffer.length / 1024)}KB) -> ${outPath}`);
}

async function main() {
  console.log('\nGenerating studio logos via Replicate Flux 1.1 Pro...\n');

  if (!fs.existsSync(OUT)) {
    fs.mkdirSync(OUT, { recursive: true });
  }

  for (const logo of LOGOS) {
    const outPath = path.join(OUT, `${logo.name}-logo.webp`);
    console.log(`[${logo.name.toUpperCase()}]`);
    try {
      await generate(logo.prompt, logo.w, logo.h, outPath);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
    }
  }
  console.log('\nDone!\n');
}

main().catch(e => { console.error(e); process.exit(1); });

/**
 * Generate VOID. studio artwork images using Replicate API (Flux Schnell)
 * Usage: REPLICATE_API_TOKEN=xxx node scripts/generate-void-art.mjs
 */

import { writeFile, access } from 'fs/promises';
import { join } from 'path';

const API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!API_TOKEN) {
  console.error('Missing REPLICATE_API_TOKEN');
  process.exit(1);
}

const OUT_DIR = join(import.meta.dirname, '..', 'public', 'images', 'products', 'void');

const STYLE = 'minimalist contemporary art, muted palette, contemplative, gallery-quality, high resolution, clean composition';

const ARTWORKS = [
  {
    id: 'void-001',
    name: 'Silence No. 7',
    prompt: `${STYLE}, near-monochrome abstract painting, titanium white and raw umber fields dissolving into each other, Agnes Martin inspired trembling subtle textures, barely visible horizontal lines, meditative quietude, white canvas with extremely subtle warm undertones`,
  },
  {
    id: 'void-002',
    name: 'Negative Space',
    prompt: `${STYLE}, white on white abstract art, barely perceptible geometric forms emerging from ivory ground, extremely subtle shadows and depth, Malevich suprematist influence, zen emptiness, almost invisible rectangles floating on pale surface`,
  },
  {
    id: 'void-003',
    name: 'Gradient Prayer',
    prompt: `${STYLE}, single seamless gradient from cerulean blue to bone white, vertical color field painting, Rothko inspired luminous color transition, transcendent atmospheric quality, no hard edges, pure smooth color blending`,
  },
  {
    id: 'void-004',
    name: 'Threshold',
    prompt: `${STYLE}, geometric aperture carved from absolute darkness, single rectangular opening of dim light in center of black void, James Turrell light installation inspired, architectural minimal, deep blacks with subtle light rectangle`,
  },
  {
    id: 'void-005',
    name: 'Erosion',
    prompt: `${STYLE}, dark abstract painting with layers wearing away revealing ghost traces beneath, palimpsest texture, time and entropy made visible, dark charcoal and graphite tones with faint pale marks showing through, elegant decay`,
  },
  {
    id: 'void-006',
    name: 'Monument to Absence',
    prompt: `${STYLE}, monolithic matte black form floating against slightly darker black ground, subtle difference between two blacks, Ad Reinhardt black painting inspired, anti-monument, barely visible geometric shape in darkness`,
  },
  {
    id: 'void-007',
    name: 'Meridian',
    prompt: `${STYLE}, single precise vertical line bisecting empty white field, Barnett Newman zip painting inspired, thin dark line on pale ground, mathematical precision, vast white space divided by one perfect line`,
  },
  {
    id: 'void-008',
    name: 'Still Water',
    prompt: `${STYLE}, perfectly still water surface in greyscale, Hiroshi Sugimoto seascape inspired, horizon line dissolving, subtle gradients from dark to light, zen calm, reflection merging with reality, monochrome photography aesthetic`,
  },
  {
    id: 'void-009',
    name: 'Grid Collapse',
    prompt: `${STYLE}, precise geometric grid beginning to buckle and fold at center, gravitational distortion of mathematical order, fine black lines on white ground warping inward, entropy consuming structure, clean minimal graphic`,
  },
  {
    id: 'void-010',
    name: 'Last Light',
    prompt: `${STYLE}, thin horizontal band of warm amber light at edge of otherwise completely black composition, twilight atmosphere, elegiac last moment of light before darkness, minimal landscape, liminal moment between day and night`,
  },
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fileExists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function createPrediction(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt,
          num_outputs: 1,
          aspect_ratio: '3:4',
          output_format: 'png',
          output_quality: 90,
        },
      }),
    });
    if (res.status === 429) {
      const wait = (i + 1) * 10000;
      console.log(`    Rate limited, waiting ${wait / 1000}s...`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error: ${res.status} ${err}`);
    }
    return res.json();
  }
  throw new Error('Max retries exceeded');
}

async function pollPrediction(id) {
  for (let i = 0; i < 120; i++) {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
    });
    const data = await res.json();
    if (data.status === 'succeeded') return data.output;
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(`Prediction ${data.status}: ${data.error}`);
    }
    await sleep(2000);
  }
  throw new Error('Timeout waiting for prediction');
}

async function downloadImage(url, filepath) {
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(filepath, buf);
}

async function main() {
  console.log(`Generating ${ARTWORKS.length} VOID. artworks...\n`);

  for (const art of ARTWORKS) {
    const filepath = join(OUT_DIR, `${art.id}-art.png`);
    if (await fileExists(filepath)) {
      console.log(`  SKIP ${art.name} (already exists)`);
      continue;
    }

    try {
      console.log(`  Creating: ${art.name}...`);
      const pred = await createPrediction(art.prompt);
      console.log(`    Prediction ${pred.id}, polling...`);
      const output = await pollPrediction(pred.id);
      const imageUrl = Array.isArray(output) ? output[0] : output;
      await downloadImage(imageUrl, filepath);
      console.log(`  ✓ ${art.name} saved`);
      // Small delay between requests to avoid rate limiting
      await sleep(3000);
    } catch (err) {
      console.error(`  ✗ ${art.name}: ${err.message}`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);

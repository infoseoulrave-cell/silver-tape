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

// Monochrome Conceptual + Russian Formalism — with visual density
const STYLE = 'monochrome conceptual art, Russian Constructivist influence, gallery-quality, high resolution, stark graphic composition, intellectual rigor, museum exhibition photograph';

const ARTWORKS = [
  {
    id: 'void-001',
    name: 'Silence No. 7',
    prompt: `${STYLE}, large square canvas with dense layered white-on-white impasto oil paint, thick visible brushstrokes and palette knife ridges casting real shadows, subtle grey undertones emerging from built-up texture, Kazimir Malevich White on White reinterpreted with extreme material presence, monochrome sculptural surface, side-lit to reveal topography of paint`,
  },
  {
    id: 'void-002',
    name: 'Negative Space',
    prompt: `${STYLE}, black and white photograph of an empty modernist gallery room, stark concrete walls converging to a single small square window of bright white light at the far end, strong geometric perspective lines, deep shadows and blown-out highlights, El Lissitzky Proun space meets James Turrell, architectural void as subject, grainy high-contrast film texture`,
  },
  {
    id: 'void-003',
    name: 'Gradient Prayer',
    prompt: `${STYLE}, monumental vertical canvas with seamless gradient from absolute matte black at bottom dissolving into luminous silver-white at top, visible fine canvas weave texture throughout, Ad Reinhardt black painting meeting Mark Rothko spiritual light, meditative chromatic transition, the gradient itself as a transcendent object, soft brushed graphite surface quality`,
  },
  {
    id: 'void-004',
    name: 'Threshold',
    prompt: `${STYLE}, stark geometric composition, massive black trapezoid form dominating the frame against raw concrete grey background, sharp hard edges, Constructivist architectural model photograph, El Lissitzky Beat the Whites with the Red Wedge energy but in pure greyscale, dramatic diagonal tension, bold graphic power, suprematist spatial depth`,
  },
  {
    id: 'void-005',
    name: 'Erosion',
    prompt: `${STYLE}, heavily textured dark abstract work, multiple layers of black ink and charcoal on torn and reassembled paper, visible rips seams and creases creating a topographic surface, burnt edges revealing layers beneath, Robert Rauschenberg black painting meets Arte Povera materiality, palimpsest of erasure and accumulation, high contrast detail photograph`,
  },
  {
    id: 'void-006',
    name: 'Monument to Absence',
    prompt: `${STYLE}, solitary geometric black monolith sculpture in empty white gallery space, perfect matte black rectangular form casting a precise shadow on polished concrete floor, minimal but imposing, Tony Smith Die meets 2001 monolith, one object in vast emptiness, architectural scale, dramatic museum lighting from above, silver gelatin print quality`,
  },
  {
    id: 'void-007',
    name: 'Meridian',
    prompt: `${STYLE}, bold typographic artwork, single Russian Cyrillic character or geometric letterform rendered enormous in matte black against raw off-white ground, Alexander Rodchenko constructivist poster influence, asymmetric placement creating dynamic tension, visible ink bleed and printing texture, woodblock or letterpress materiality, graphic and intellectual`,
  },
  {
    id: 'void-008',
    name: 'Still Water',
    prompt: `${STYLE}, Hiroshi Sugimoto inspired seascape but with more tonal complexity, black and white long-exposure ocean where water becomes smooth silk meeting overcast sky at a barely visible horizon line, rich silver-grey tonal range from deep black foreground to luminous white sky, grain and subtle tonal gradations, platinum print quality, contemplative infinite`,
  },
  {
    id: 'void-009',
    name: 'Grid Collapse',
    prompt: `${STYLE}, precise black ink grid on white paper with systematic distortions, lines thickening warping and dissolving at the center creating a gravitational vortex effect, Sol LeWitt systematic drawing meets Op Art perceptual disruption, mathematical system breaking down, architectural blueprint being consumed by entropy, stark black on white, technical pen precision`,
  },
  {
    id: 'void-010',
    name: 'Last Light',
    prompt: `${STYLE}, high contrast black and white photograph of concrete brutalist architecture at twilight, a single horizontal slit window emitting a thin line of bright white light across a massive dark facade, dramatic scale between tiny light and immense darkness, Tadao Ando meets Soviet brutalism, liminal moment, architectural meditation on light and void`,
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

/**
 * Generate VOID. studio artwork images batch 2 (void-011 ~ void-020)
 * Usage: REPLICATE_API_TOKEN=xxx node scripts/generate-void-art-2.mjs
 */

import { writeFile, access } from 'fs/promises';
import { join } from 'path';

const API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!API_TOKEN) {
  console.error('Missing REPLICATE_API_TOKEN');
  process.exit(1);
}

const OUT_DIR = join(import.meta.dirname, '..', 'public', 'images', 'products', 'void');

// Monochrome Conceptual + Russian Formalism — with visual density (batch 2)
const STYLE = 'monochrome conceptual art, Russian Constructivist influence, gallery-quality, high resolution, stark graphic composition, intellectual rigor, museum exhibition photograph';

const ARTWORKS = [
  {
    id: 'void-011',
    name: 'Manifesto',
    prompt: `${STYLE}, large-scale constructivist propaganda poster reimagined in pure black and white, bold diagonal composition with overlapping geometric planes circles and triangles, Alexander Rodchenko photomontage energy, strong typographic blocks of abstract symbols not readable text, revolutionary dynamic asymmetry, lithograph print texture, agitprop aesthetic stripped of color`,
  },
  {
    id: 'void-012',
    name: 'Archive of Dust',
    prompt: `${STYLE}, overhead photograph of aged documents and papers arranged in a grid on black surface, foxed and yellowed paper fragments with faded typewriter text and official stamps, monochrome documentary photography, Hanne Darboven systematic archive aesthetic, forensic cataloging of forgotten memory, each fragment precisely spaced, silver gelatin print`,
  },
  {
    id: 'void-013',
    name: 'Concrete Poem',
    prompt: `${STYLE}, abstract geometric composition of overlapping concrete architectural forms, multiple brutalist building facades creating a layered collage in deep greys and blacks, Lyubov Popova spatial force construction influence, intersecting planes and sharp angles, photogram quality with strong graphic shadows, urban archaeology in monochrome`,
  },
  {
    id: 'void-014',
    name: 'Untitled (Frequency)',
    prompt: `${STYLE}, dense pattern of horizontal lines with varying thickness and spacing creating a moiré interference pattern, oscilloscope waveform frozen in ink, Bridget Riley op art precision in black and white, visual vibration and optical tension, the lines themselves creating perceived depth and movement, screen print quality on white ground`,
  },
  {
    id: 'void-015',
    name: 'The Weight of White',
    prompt: `${STYLE}, crumpled white paper dramatically side-lit against deep black background, every fold and crease casting precise shadows, the paper itself as sculptural object, chiaroscuro study, still life photography in the tradition of Edward Weston, texture and form from the simplest material, large format camera clarity, platinum palladium print`,
  },
  {
    id: 'void-016',
    name: 'System Failure',
    prompt: `${STYLE}, glitch art in monochrome, corrupted digital image data rendered as horizontal scan lines and displaced pixel blocks in black white and grey, Nam June Paik video distortion meets Ryoji Ikeda data visualization, systematic digital entropy, cathode ray tube decay, analog-digital breakdown captured as graphic art, screen artifact aesthetic`,
  },
  {
    id: 'void-017',
    name: 'Correspondence',
    prompt: `${STYLE}, minimalist composition of two identical black circles placed on opposite sides of a white canvas connected by a single thin line, relational tension between forms, El Lissitzky suprematist geometry, the space between objects as the true subject, mathematical relationship diagram elevated to fine art, clean vector precision with slight ink texture`,
  },
  {
    id: 'void-018',
    name: 'Ruin',
    prompt: `${STYLE}, aerial black and white photograph of abandoned Soviet industrial complex, geometric patterns of collapsed roofs and empty courtyards creating an abstract composition when viewed from above, Tarkovsky Stalker zone aesthetic, beauty in structural decay, high contrast architectural photography, stark shadows revealing geometric skeleton of forgotten infrastructure`,
  },
  {
    id: 'void-019',
    name: 'Measure',
    prompt: `${STYLE}, precise drawing of concentric rectangles nested within each other on white paper, each rectangle slightly rotated creating a subtle spiral vortex effect, Frank Stella minimalist painting influence meets technical drafting, obsessive geometric repetition, each line drawn with ruling pen precision, the meditation of systematic labor made visible`,
  },
  {
    id: 'void-020',
    name: 'After Language',
    prompt: `${STYLE}, abstract calligraphic marks in black sumi ink on handmade white washi paper, gestural brushstrokes that suggest written language but remain illegible, between East Asian calligraphy and Franz Kline abstract expressionism, the ghost of meaning, ink splatter and dry brush texture, asemic writing as pure visual form, contemplative mark-making`,
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
  console.log(`Generating ${ARTWORKS.length} VOID. artworks (batch 2)...\n`);

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
      await sleep(3000);
    } catch (err) {
      console.error(`  ✗ ${art.name}: ${err.message}`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);

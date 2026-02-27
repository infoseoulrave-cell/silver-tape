#!/usr/bin/env node
/**
 * Optimize Surreal Band images for PHANTOM REEL studio
 * - Resize to max 2000px on longest side
 * - Convert to JPEG quality 85
 * - ~8-14MB PNG → ~300-500KB JPG each
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = path.join('C:', 'Users', 'A', 'Downloads', 'Surreal Band');
const DEST = path.join('C:', 'Users', 'A', 'hangover-web', 'public', 'images', 'products', 'phantom-reel');

// Map: source filename fragment → product id + slug
const IMAGE_MAP = [
  { match: 'kive-image (22)',     id: 'phr-001', slug: 'lone-cosmonaut' },
  { match: 'kive-image (23)',     id: 'phr-002', slug: 'dust-horizon' },
  { match: 'kive-image (24)',     id: 'phr-003', slug: 'silent-terrain' },
  { match: 'spaceship',          id: 'phr-004', slug: 'eagle-has-landed' },
  { match: 'space station.png',  id: 'phr-005', slug: 'module-seven' },
  { match: 'space station (1)',  id: 'phr-006', slug: 'station-drift' },
  { match: 'Solitary gas station pump in dense fog_ sodium vapor streetlights creating amber halos through atmospheric haze_ deserted industrial roadway_ liminal space aesthetic_ nocturnal isolation_ cinem', id: 'phr-007', slug: 'pump-seven' },
  { match: 'Solitary gas station pump in dense fog_ sodium vapor streetlights creating amber halos through atmospheric haze_ deserted industrial roadway_ liminal space aesthetic_ nocturnal isolation_ c (1)', id: 'phr-008', slug: 'last-stop' },
  { match: 'Black latex-like material', id: 'phr-009', slug: 'pinned-dark' },
  { match: 'Black mylar foil',   id: 'phr-010', slug: 'silver-wrap' },
  { match: 'Crumpled metallic',  id: 'phr-011', slug: 'crushed-chrome' },
];

if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

async function main() {
  const files = fs.readdirSync(SRC).filter(f => f.endsWith('.png'));
  console.log(`\n📸 Optimizing ${files.length} images for PHANTOM REEL...\n`);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const srcPath = path.join(SRC, file);
    const mapping = IMAGE_MAP.find(m => file.includes(m.match));

    if (!mapping) {
      console.log(`  ⚠ No mapping for: ${file.substring(0, 60)}...`);
      continue;
    }

    const outName = `${mapping.id}-art.jpg`;
    const outPath = path.join(DEST, outName);

    const beforeSize = fs.statSync(srcPath).size;
    totalBefore += beforeSize;

    await sharp(srcPath)
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(outPath);

    const afterSize = fs.statSync(outPath).size;
    totalAfter += afterSize;

    const reduction = Math.round((1 - afterSize / beforeSize) * 100);
    console.log(`  ✓ ${outName.padEnd(18)} ${(Math.round(beforeSize/1024) + 'KB').padEnd(10)} → ${(Math.round(afterSize/1024) + 'KB').padEnd(8)} (-${reduction}%)`);
  }

  console.log(`\n✅ Done! ${files.length} images optimized`);
  console.log(`   Before: ${Math.round(totalBefore/1024/1024)}MB → After: ${Math.round(totalAfter/1024/1024)}MB`);
  console.log(`   Saved to: ${DEST}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });

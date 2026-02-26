#!/usr/bin/env node
/**
 * Image Optimizer for SILVERTAPE
 *
 * Usage:
 *   node scripts/optimize-images.mjs                    # optimize all images in public/images/
 *   node scripts/optimize-images.mjs public/images/hero  # optimize specific directory
 *   node scripts/optimize-images.mjs image.png           # optimize single file
 *
 * - PNG/JPG over 500KB are compressed
 * - Max dimension: 2400px (hero) / 1600px (products)
 * - Quality: 85 for JPG, lossless compression for PNG
 * - Originals are overwritten (back up first if needed)
 */

import { readdir, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import sharp from 'sharp';

const THRESHOLD = 500 * 1024; // 500KB
const MAX_HERO = 2400;
const MAX_PRODUCT = 1600;
const JPG_QUALITY = 85;

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(full)));
    } else {
      const ext = extname(entry.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        files.push(full);
      }
    }
  }
  return files;
}

async function optimizeFile(filePath) {
  const info = await stat(filePath);
  if (info.size < THRESHOLD) return null;

  const isHero = filePath.includes('/hero/') || filePath.includes('\\hero\\');
  const maxDim = isHero ? MAX_HERO : MAX_PRODUCT;
  const ext = extname(filePath).toLowerCase();

  const sizeBefore = info.size;
  const image = sharp(filePath);
  const meta = await image.metadata();

  let pipeline = image.resize({
    width: Math.min(meta.width || maxDim, maxDim),
    height: Math.min(meta.height || maxDim, maxDim),
    fit: 'inside',
    withoutEnlargement: true,
  });

  if (ext === '.png') {
    pipeline = pipeline.png({ compressionLevel: 9, effort: 10 });
  } else {
    pipeline = pipeline.jpeg({ quality: JPG_QUALITY, mozjpeg: true });
  }

  const buffer = await pipeline.toBuffer();
  if (buffer.length < sizeBefore) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(filePath, buffer);
    return { path: filePath, before: sizeBefore, after: buffer.length };
  }
  return null;
}

async function main() {
  const target = process.argv[2] || 'public/images';
  const resolved = resolve(target);

  let files;
  const s = await stat(resolved);
  if (s.isDirectory()) {
    files = await getFiles(resolved);
  } else {
    files = [resolved];
  }

  console.log(`Found ${files.length} image(s). Optimizing files > ${THRESHOLD / 1024}KB...\n`);

  let totalSaved = 0;
  let optimized = 0;

  for (const file of files) {
    const result = await optimizeFile(file);
    if (result) {
      const saved = result.before - result.after;
      totalSaved += saved;
      optimized++;
      const pct = ((saved / result.before) * 100).toFixed(1);
      console.log(
        `  ${(result.before / 1024 / 1024).toFixed(1)}MB → ${(result.after / 1024 / 1024).toFixed(1)}MB  (-${pct}%)  ${result.path}`
      );
    }
  }

  console.log(`\nDone. ${optimized}/${files.length} files optimized. Saved ${(totalSaved / 1024 / 1024).toFixed(1)}MB total.`);
}

main().catch(console.error);

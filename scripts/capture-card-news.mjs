#!/usr/bin/env node
/**
 * 인스타그램 카드뉴스 30장을 PNG로 추출
 * 사용: npm run dev 로 서버 실행 후 다른 터미널에서
 *       node scripts/capture-card-news.mjs
 * 필요: puppeteer (npm install puppeteer)
 */

import { mkdir } from 'fs/promises';
import { join } from 'path';

const BASE = 'http://localhost:3000';
const OUT_DIR = join(process.cwd(), 'public', 'instagram', 'card-news');
const VIEWPORT = { width: 1080, height: 1350 };

async function main() {
  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch {
    console.error('puppeteer가 필요합니다. 실행: npm install puppeteer');
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const browser = await puppeteer.default.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  for (let id = 1; id <= 30; id++) {
    const url = `${BASE}/instagram/card-news/${id}`;
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-card]', { timeout: 5000 }).catch(() => {});

    const card = await page.$('[data-card]') || await page.$('.card');
    if (!card) {
      console.warn(`#${id} 카드 요소를 찾지 못함. 전체 페이지 캡처.`);
    }

    const path = join(OUT_DIR, `card-${String(id).padStart(2, '0')}.png`);
    if (card) {
      await card.screenshot({ path });
    } else {
      await page.screenshot({ path });
    }
    console.log(`저장: card-${String(id).padStart(2, '0')}.png`);
  }

  await browser.close();
  console.log(`완료. ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

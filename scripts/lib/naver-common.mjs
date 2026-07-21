/**
 * 네이버 스마트스토어 공통 유틸리티
 * .env.local 파싱, OAuth2 토큰 발급, products.ts 파싱, TAG_KO 사전
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, '..', '..');

/** .env.local 파싱 → { KEY: VALUE } 객체 반환 */
export function loadEnv() {
  const content = readFileSync(resolve(ROOT, '.env.local'), 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

export const BASE = 'https://api.commerce.naver.com/external';

/** OAuth2 토큰 발급 (bcrypt 서명) */
export async function getToken(clientId, clientSecret) {
  const ts = Date.now();
  const hashed = bcrypt.hashSync(`${clientId}_${ts}`, clientSecret);
  const sign = Buffer.from(hashed).toString('base64');
  const body = new URLSearchParams({
    client_id: clientId, timestamp: String(ts), client_secret_sign: sign,
    grant_type: 'client_credentials', type: 'SELF',
  });
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  return (await res.json()).access_token;
}

/** products.ts 파싱 → [{ id, slug, title, titleKo, category, artist, tags }] */
export function parseProducts() {
  const source = readFileSync(resolve(ROOT, 'src', 'data', 'products.ts'), 'utf-8');
  const blocks = source.split(/\n\s*\{[\s\n]*id:/g).slice(1);
  const products = [];
  for (const block of blocks) {
    const get = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*'([^']*)'`));
      return m ? m[1] : '';
    };
    const tagsMatch = block.match(/tags:\s*\[([^\]]*)\]/);
    const tags = tagsMatch
      ? tagsMatch[1].match(/'([^']*)'/g)?.map(t => t.replace(/'/g, '')) || []
      : [];
    products.push({
      id: get('id'),
      slug: get('slug'),
      title: get('title'),
      titleKo: get('titleKo'),
      category: get('category'),
      artist: get('artist'),
      tags,
    });
  }
  return products;
}

/** 태그 → 한국어 (모든 스크립트 통합) */
export const TAG_KO = {
  expressionism: '표현주의', abstract: '추상화', impasto: '임파스토',
  emotion: '감성아트', portrait: '초상화', 'neo-pop': '네오팝',
  figurative: '구상화', landscape: '풍경화', surreal: '초현실',
  minimal: '미니멀', geometric: '기하학', nature: '자연풍경',
  urban: '도시감성', retro: '레트로', vintage: '빈티지',
  typography: '타이포', space: '우주', architecture: '건축',
  pop: '팝아트', 'still-life': '정물', car: '자동차',
  animal: '동물', flower: '플라워', neon: '네온',
  chrome: '크롬', modern: '모던아트', contemporary: '현대미술',
  monochrome: '모노톤', halftone: '하프톤', calligraphy: '캘리',
  ink: '수묵', film: '필름', lunar: '달', liminal: '리미널',
  material: '물성', collage: '콜라주', contradiction: '오브제',
  institutional: '인스티튜셔널',
};

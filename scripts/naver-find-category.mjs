import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (t.length === 0 || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const CLIENT_ID = env.NAVER_COMMERCE_APP_ID;
const CLIENT_SECRET = env.NAVER_COMMERCE_APP_SECRET;
const ts = Date.now();
const hashed = bcrypt.hashSync(`${CLIENT_ID}_${ts}`, CLIENT_SECRET);
const sign = Buffer.from(hashed).toString('base64');

const body = new URLSearchParams({
  client_id: CLIENT_ID,
  timestamp: String(ts),
  client_secret_sign: sign,
  grant_type: 'client_credentials',
  type: 'SELF',
});

const tokenRes = await fetch('https://api.commerce.naver.com/external/v1/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: body.toString(),
});
const { access_token } = await tokenRes.json();

const catRes = await fetch('https://api.commerce.naver.com/external/v1/categories', {
  headers: { Authorization: `Bearer ${access_token}` },
});
const cats = await catRes.json();
const keyword = process.argv[2] || '포스터';
const arr = Object.values(cats).filter(
  (c) => c && c.wholeCategoryName && c.wholeCategoryName.includes(keyword)
);
for (const c of arr) {
  console.log(`${c.id} → ${c.wholeCategoryName}${c.last ? ' [LEAF]' : ''}`);
}
console.log(`\n총 ${arr.length}개 결과`);

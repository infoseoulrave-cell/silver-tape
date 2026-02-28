import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const CID = env.NAVER_COMMERCE_APP_ID;
const CS = env.NAVER_COMMERCE_APP_SECRET;
const BASE = 'https://api.commerce.naver.com/external';
const ts = Date.now();
const hashed = bcrypt.hashSync(`${CID}_${ts}`, CS);
const sign = Buffer.from(hashed).toString('base64');
const body = new URLSearchParams({
  client_id: CID, timestamp: String(ts), client_secret_sign: sign,
  grant_type: 'client_credentials', type: 'SELF',
});
const tokenRes = await fetch(`${BASE}/v1/oauth2/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: body.toString(),
});
const { access_token } = await tokenRes.json();

const res = await fetch(`${BASE}/v1/products/search`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ productStatusTypes: ['SALE'], page: 1, size: 3 }),
});
const data = await res.json();
console.log('First item keys:', Object.keys(data.contents[0]));
console.log('\nFirst item:', JSON.stringify(data.contents[0], null, 2));

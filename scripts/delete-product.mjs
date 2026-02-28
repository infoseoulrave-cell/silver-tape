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
const ts = Date.now();
const hashed = bcrypt.hashSync(`${CID}_${ts}`, CS);
const sign = Buffer.from(hashed).toString('base64');

const body = new URLSearchParams({
  client_id: CID,
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

const productNo = process.argv[2] || '13119201072';
console.log(`🗑️ 상품 삭제: ${productNo}`);

const res = await fetch(`https://api.commerce.naver.com/external/v2/products/origin-products/${productNo}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${access_token}` },
});

console.log('Status:', res.status);
try {
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
} catch {
  console.log('(응답 body 없음)');
}

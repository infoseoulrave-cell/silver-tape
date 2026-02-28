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

async function getToken() {
  const ts = Date.now();
  const hashed = bcrypt.hashSync(`${CID}_${ts}`, CS);
  const sign = Buffer.from(hashed).toString('base64');
  const body = new URLSearchParams({
    client_id: CID, timestamp: String(ts), client_secret_sign: sign,
    grant_type: 'client_credentials', type: 'SELF',
  });
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  return (await res.json()).access_token;
}

async function searchProducts(token, page = 1) {
  const res = await fetch(`${BASE}/v1/products/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productStatusTypes: ['SALE', 'SUSPENSION'],
      page,
      size: 100,
    }),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { error: text.slice(0, 300) }; }
}

const token = await getToken();
const cmd = process.argv[2] || 'list';

if (cmd === 'list') {
  let page = 1;
  let all = [];
  while (true) {
    const data = await searchProducts(token, page);
    if (data.contents && data.contents.length > 0) {
      all.push(...data.contents);
      console.log(`  페이지 ${page}: ${data.contents.length}개`);
      if (data.contents.length < 100) break;
      page++;
    } else {
      if (page === 1) console.log('응답:', JSON.stringify(data).slice(0, 500));
      break;
    }
  }
  console.log(`\n총 ${all.length}개 상품:`);
  for (const p of all) {
    console.log(`  ${p.originProductNo} → ${p.name}`);
  }
}

if (cmd === 'delete-all') {
  let page = 1;
  let all = [];
  while (true) {
    const data = await searchProducts(token, page);
    if (data.contents && data.contents.length > 0) {
      all.push(...data.contents);
      if (data.contents.length < 100) break;
      page++;
    } else break;
  }

  console.log(`\n🗑️ ${all.length}개 상품 전체 삭제...`);
  let ok = 0;
  for (const p of all) {
    const no = p.originProductNo;
    const res = await fetch(`${BASE}/v2/products/origin-products/${no}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 200) ok++;
    else console.log(`  삭제 실패: ${no} (${res.status})`);
    await new Promise(r => setTimeout(r, 600));
  }
  console.log(`\n✅ ${ok}/${all.length}개 삭제 완료`);
}

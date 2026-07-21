# Silver-Tape 결제 시스템 프로덕션 완성 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace file-system order storage with Supabase PostgreSQL, add Toss Payments webhook, integrate Kakao AlimTalk notifications, add Sentry error monitoring, build admin panel, and re-enable the checkout flow.

**Architecture:** Supabase PostgreSQL for persistent order storage with RLS. Toss webhook verifies payments server-to-server by re-fetching payment status from Toss API (signature headers only exist for payout events, not payment events). Kakao AlimTalk via Solapi SDK for order notifications. Sentry for error tracking. Admin panel protected by Supabase Auth.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + Auth), @supabase/supabase-js, TossPayments v2 API, Solapi Node.js SDK (solapi), @sentry/nextjs

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Supabase, Solapi, and Sentry packages**

Run:
```bash
cd "c:/Users/Admin/Seoul Rave Company/silver-tape"
npm install @supabase/supabase-js solapi @sentry/nextjs
```

**Step 2: Verify installation**

Run: `npm ls @supabase/supabase-js solapi @sentry/nextjs`
Expected: All three packages listed without errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add supabase, solapi, sentry dependencies"
```

---

## Task 2: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase.ts`
- Modify: `.env.example`

**Step 1: Create Supabase client**

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client with service role key (bypasses RLS)
// Use this in API routes only
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Client-side client with anon key (respects RLS)
// Use this in client components (admin auth)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
```

**Step 2: Update `.env.example`**

Add to `.env.example`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Solapi (카카오 알림톡)
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_PFID=          # 카카오 채널 @ID
SOLAPI_SENDER=        # 발신번호

# Sentry
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors (env vars are asserted with `!`)

**Step 4: Commit**

```bash
git add src/lib/supabase.ts .env.example
git commit -m "feat: add Supabase client initialization"
```

---

## Task 3: Create Supabase Database Schema

**Files:**
- Create: `supabase/migrations/001_orders.sql`

**Step 1: Create the migration file**

Create `supabase/migrations/001_orders.sql`:
```sql
-- orders 테이블
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL,
  shipping JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping_fee INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  payment_key TEXT,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_key ON orders(payment_key);

-- Enable RLS — only server-side service_role key can access
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- No RLS policies = anon/authenticated users have zero access
-- Only supabaseAdmin (service_role) bypasses RLS

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

**Step 2: Run this SQL in Supabase Dashboard**

Go to Supabase Dashboard → SQL Editor → paste and run the migration.
Or if Supabase CLI is set up: `supabase db push`

**Step 3: Verify table exists**

In Supabase Dashboard → Table Editor → confirm `orders` table with all columns.

**Step 4: Commit**

```bash
git add supabase/migrations/001_orders.sql
git commit -m "feat: add orders table migration for Supabase"
```

---

## Task 4: Migrate order-storage.ts to Supabase

**Files:**
- Modify: `src/lib/order-storage.ts`
- Reference: `src/types/order.ts` (no changes needed)

**Step 1: Rewrite order-storage.ts**

Replace the entire content of `src/lib/order-storage.ts` with:
```typescript
import { supabaseAdmin } from './supabase';
import type { Order } from '@/types/order';

// DB row → Order type mapping
interface OrderRow {
  id: string;
  order_id: string;
  items: Order['items'];
  shipping: Order['shipping'];
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  payment_key: string | null;
  payment_method: string | null;
  paid_at: string | null;
  status: Order['status'];
  created_at: string;
  updated_at: string;
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderId: row.order_id,
    items: row.items,
    shipping: row.shipping,
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    totalAmount: row.total_amount,
    paymentKey: row.payment_key ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    paidAt: row.paid_at ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveOrder(order: Order): Promise<void> {
  const { error } = await supabaseAdmin.from('orders').insert({
    order_id: order.orderId,
    items: order.items,
    shipping: order.shipping,
    subtotal: order.subtotal,
    shipping_fee: order.shippingFee,
    total_amount: order.totalAmount,
    status: order.status,
  });

  if (error) throw new Error(`Failed to save order: ${error.message}`);
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error || !data) return null;
  return rowToOrder(data as OrderRow);
}

export async function updateOrder(
  orderId: string,
  updates: Partial<Order>
): Promise<Order | null> {
  // Map camelCase to snake_case for DB columns
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.paymentKey !== undefined) dbUpdates.payment_key = updates.paymentKey;
  if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
  if (updates.paidAt !== undefined) dbUpdates.paid_at = updates.paidAt;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(dbUpdates)
    .eq('order_id', orderId)
    .select()
    .single();

  if (error || !data) return null;
  return rowToOrder(data as OrderRow);
}

// New: List orders for admin panel
export async function listOrders(options?: {
  status?: Order['status'];
  limit?: number;
  offset?: number;
}): Promise<{ orders: Order[]; count: number }> {
  let query = supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to list orders: ${error.message}`);

  return {
    orders: (data as OrderRow[]).map(rowToOrder),
    count: count ?? 0,
  };
}
```

**Step 2: Verify existing API routes still work**

Run: `npx tsc --noEmit`
Expected: No errors. The `saveOrder`, `getOrder`, `updateOrder` function signatures are unchanged, so all imports in `src/app/api/orders/route.ts`, `src/app/api/orders/[orderId]/route.ts`, and `src/app/api/payment/confirm/route.ts` should still compile.

**Step 3: Commit**

```bash
git add src/lib/order-storage.ts
git commit -m "feat: migrate order storage from filesystem to Supabase PostgreSQL"
```

---

## Task 5: Toss Payments Webhook Endpoint

**Files:**
- Create: `src/app/api/toss-webhook/route.ts`
- Modify: `src/lib/toss-payments.ts` (add payment lookup helper)

**Step 1: Add payment lookup helper to toss-payments.ts**

Add to the end of `src/lib/toss-payments.ts`:
```typescript
export const TOSS_PAYMENT_URL = 'https://api.tosspayments.com/v1/payments';

// Fetch payment details from Toss to verify webhook data
export async function getTossPayment(paymentKey: string): Promise<TossPaymentResponse | null> {
  const res = await fetch(`${TOSS_PAYMENT_URL}/${paymentKey}`, {
    headers: { 'Authorization': getTossAuthHeader() },
  });
  if (!res.ok) return null;
  return res.json();
}
```

Also add the import at the top of `src/lib/toss-payments.ts`:
```typescript
import type { TossPaymentResponse } from '@/types/order';
```

**Step 2: Create webhook endpoint**

Create `src/app/api/toss-webhook/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getOrder, updateOrder } from '@/lib/order-storage';
import { getTossPayment, isTossConfigured } from '@/lib/toss-payments';
import { sendAlimtalk } from '@/lib/kakao-alimtalk';

/**
 * POST /api/toss-webhook — 토스페이먼츠 웹훅 수신
 *
 * 토스가 결제 상태 변경 시 서버로 직접 호출.
 * 웹훅 데이터를 신뢰하지 않고, paymentKey로 토스 API에서 직접 조회하여 검증.
 *
 * 이벤트 타입:
 * - PAYMENT_STATUS_CHANGED: 카드/간편결제 상태 변경
 * - DEPOSIT_CALLBACK: 가상계좌 입금 확인
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, data } = body as {
      eventType: string;
      data: { paymentKey: string; orderId: string; status: string };
    };

    console.log(`[toss-webhook] event=${eventType} orderId=${data?.orderId}`);

    if (!data?.paymentKey || !data?.orderId) {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    // 1. 서버에 저장된 주문 조회
    const order = await getOrder(data.orderId);
    if (!order) {
      console.warn(`[toss-webhook] Order not found: ${data.orderId}`);
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    // 이미 최종 상태이면 무시 (idempotent)
    if (['paid', 'cancelled'].includes(order.status)) {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    // 2. 웹훅 데이터를 신뢰하지 않고 토스 API에서 직접 결제 상태 조회
    if (!isTossConfigured()) {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    const payment = await getTossPayment(data.paymentKey);
    if (!payment) {
      console.error(`[toss-webhook] Failed to verify payment: ${data.paymentKey}`);
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    // 3. 결제 상태에 따라 주문 업데이트
    if (eventType === 'PAYMENT_STATUS_CHANGED' || eventType === 'DEPOSIT_CALLBACK') {
      if (payment.status === 'DONE' && order.status === 'pending') {
        // 금액 검증
        if (payment.totalAmount !== order.totalAmount) {
          console.error(`[toss-webhook] Amount mismatch: payment=${payment.totalAmount} order=${order.totalAmount}`);
          await updateOrder(data.orderId, { status: 'failed' });
          return NextResponse.json({ message: 'OK' }, { status: 200 });
        }

        await updateOrder(data.orderId, {
          status: 'paid',
          paymentKey: payment.paymentKey,
          paymentMethod: payment.method,
          paidAt: payment.approvedAt,
        });

        // 카카오 알림톡 — 결제 완료 (비차단)
        sendAlimtalk('order_complete', {
          orderId: data.orderId,
          name: order.shipping.name,
          phone: order.shipping.phone,
          totalAmount: order.totalAmount,
        }).catch(err => console.error('[toss-webhook] AlimTalk failed:', err));
      }

      if (payment.status === 'CANCELED') {
        await updateOrder(data.orderId, { status: 'cancelled' });
      }
    }

    // 토스는 200 OK를 받아야 재시도하지 않음
    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (err) {
    console.error('[toss-webhook] Error:', err);
    // 에러여도 200 반환하여 무한 재시도 방지
    // Sentry가 에러를 캡처함
    return NextResponse.json({ message: 'OK' }, { status: 200 });
  }
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: May fail because `sendAlimtalk` doesn't exist yet. That's OK — Task 6 creates it.

**Step 4: Commit**

```bash
git add src/lib/toss-payments.ts src/app/api/toss-webhook/route.ts
git commit -m "feat: add Toss Payments webhook endpoint with server-side payment verification"
```

---

## Task 6: Kakao AlimTalk Integration (Solapi)

**Files:**
- Create: `src/lib/kakao-alimtalk.ts`

**Step 1: Create the AlimTalk utility**

Create `src/lib/kakao-alimtalk.ts`:
```typescript
import { SolapiMessageService } from 'solapi';

const solapi = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!,
);

const PFID = process.env.SOLAPI_PFID!;       // 카카오 채널 @ID
const SENDER = process.env.SOLAPI_SENDER!;     // 발신번호

// 알림톡 템플릿 ID 매핑
// 토스페이먼츠 개발자센터에서 템플릿 등록 후 ID를 여기에 입력
const TEMPLATE_IDS: Record<string, string> = {
  order_complete: process.env.SOLAPI_TPL_ORDER_COMPLETE ?? '',
  deposit_confirmed: process.env.SOLAPI_TPL_DEPOSIT_CONFIRMED ?? '',
  shipping_started: process.env.SOLAPI_TPL_SHIPPING_STARTED ?? '',
};

interface AlimtalkData {
  orderId: string;
  name: string;
  phone: string;
  totalAmount: number;
  trackingNumber?: string;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export async function sendAlimtalk(
  templateType: keyof typeof TEMPLATE_IDS,
  data: AlimtalkData,
): Promise<void> {
  const templateId = TEMPLATE_IDS[templateType];

  // 템플릿 ID가 없으면 (아직 심사 전) 건너뛰기
  if (!templateId || !PFID || !SENDER) {
    console.warn(`[alimtalk] Skipped: missing config for ${templateType}`);
    return;
  }

  // 전화번호 포맷 정리 (01012345678 → 01012345678)
  const to = data.phone.replace(/[^0-9]/g, '');

  // 템플릿 변수 (Solapi에서 #{변수명} 형식)
  const variables: Record<string, string> = {
    '#{고객명}': data.name,
    '#{주문번호}': data.orderId,
    '#{결제금액}': formatPrice(data.totalAmount),
  };

  if (data.trackingNumber) {
    variables['#{운송장번호}'] = data.trackingNumber;
  }

  await solapi.send({
    to,
    from: SENDER,
    kakaoOptions: {
      pfId: PFID,
      templateId,
      variables,
    },
  });

  console.log(`[alimtalk] Sent ${templateType} to ${to} for order ${data.orderId}`);
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS (or only warnings about env vars)

**Step 3: Commit**

```bash
git add src/lib/kakao-alimtalk.ts
git commit -m "feat: add Kakao AlimTalk notification via Solapi SDK"
```

---

## Task 7: Add AlimTalk to Payment Confirm Route

**Files:**
- Modify: `src/app/api/payment/confirm/route.ts`

**Step 1: Add AlimTalk trigger after successful payment**

Add import at top of `src/app/api/payment/confirm/route.ts`:
```typescript
import { sendAlimtalk } from '@/lib/kakao-alimtalk';
```

After the `updateOrder` call on line 78 (inside the `if (isTossConfigured())` block, after the Meta event), add:
```typescript
      // 7. 카카오 알림톡 — 주문 완료 (비차단)
      sendAlimtalk('order_complete', {
        orderId,
        name: order.shipping.name,
        phone: order.shipping.phone,
        totalAmount: paymentData.totalAmount,
      }).catch(err => console.error('[payment/confirm] AlimTalk failed:', err));
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/api/payment/confirm/route.ts
git commit -m "feat: trigger Kakao AlimTalk on payment confirmation"
```

---

## Task 8: Sentry Error Monitoring Setup

**Files:**
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`
- Modify: `next.config.ts`

**Step 1: Run Sentry wizard**

Run:
```bash
cd "c:/Users/Admin/Seoul Rave Company/silver-tape"
npx @sentry/wizard@latest -i nextjs
```

Follow prompts to:
- Enter Sentry DSN
- Accept instrumentation of Next.js config

If the wizard fails or for manual setup:

**Step 2: Create sentry.client.config.ts**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});
```

**Step 3: Create sentry.server.config.ts**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

**Step 4: Create sentry.edge.config.ts**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

**Step 5: Update next.config.ts**

```typescript
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
```

**Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds (Sentry DSN can be empty for build — it just won't send events)

**Step 7: Commit**

```bash
git add sentry.client.config.ts sentry.server.config.ts sentry.edge.config.ts next.config.ts
git commit -m "feat: add Sentry error monitoring"
```

---

## Task 9: Admin Authentication Middleware

**Files:**
- Create: `src/middleware.ts`

**Step 1: Create middleware for admin route protection**

Create `src/middleware.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);

export async function middleware(request: NextRequest) {
  // Only protect /admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow /admin/login without auth
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get('sb-access-token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user || !ADMIN_EMAILS.includes(user.email ?? '')) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

**Step 2: Add ADMIN_EMAILS to .env.example**

```
# Admin
ADMIN_EMAILS=minho@example.com
```

**Step 3: Commit**

```bash
git add src/middleware.ts .env.example
git commit -m "feat: add middleware for admin route authentication"
```

---

## Task 10: Admin Login Page

**Files:**
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/login/login.module.css`

**Step 1: Create admin login page**

Create `src/app/admin/login/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';
import styles from './login.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.session) {
      setError(authError?.message ?? '로그인에 실패했습니다.');
      setLoading(false);
      return;
    }

    // Set cookie for middleware
    document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

    router.push('/admin');
  }

  return (
    <main className={styles.container}>
      <form onSubmit={handleLogin} className={styles.form}>
        <h1 className={styles.title}>SILVERTAPE ADMIN</h1>

        {error && <p className={styles.error}>{error}</p>}

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={styles.input}
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={styles.input}
          required
        />
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </main>
  );
}
```

**Step 2: Create login styles**

Create `src/app/admin/login/login.module.css`:
```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #0a0a0a;
}

.form {
  width: 100%;
  max-width: 380px;
  padding: 48px 32px;
  background: #111;
  border: 1px solid #222;
}

.title {
  font-family: var(--ho-font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-align: center;
  margin-bottom: 32px;
  color: #fff;
}

.input {
  width: 100%;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #0a0a0a;
  border: 1px solid #333;
  color: #fff;
  font-size: 14px;
  outline: none;
}

.input:focus {
  border-color: #fff;
}

.button {
  width: 100%;
  padding: 16px;
  margin-top: 8px;
  background: #fff;
  color: #000;
  border: none;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.05em;
  cursor: pointer;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #ff6b6b;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
}
```

**Step 3: Commit**

```bash
git add src/app/admin/login/
git commit -m "feat: add admin login page with Supabase Auth"
```

---

## Task 11: Admin Orders Dashboard

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/admin.module.css`
- Create: `src/app/admin/layout.tsx`

**Step 1: Create admin layout**

Create `src/app/admin/layout.tsx`:
```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
```

Note: This is a separate layout that does NOT include the site's header/footer. The admin panel is isolated.

**Step 2: Create admin orders page**

Create `src/app/admin/page.tsx`:
```tsx
import { listOrders } from '@/lib/order-storage';
import styles from './admin.module.css';

const STATUS_LABELS: Record<string, string> = {
  pending: '결제 대기',
  paid: '결제 완료',
  failed: '결제 실패',
  preparing: '상품 준비',
  shipped: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { orders, count } = await listOrders({ limit: 50 });

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>SILVERTAPE ADMIN</h1>
        <span className={styles.count}>주문 {count}건</span>
      </header>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>주문번호</th>
            <th>고객</th>
            <th>금액</th>
            <th>상태</th>
            <th>결제수단</th>
            <th>일시</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.orderId}>
              <td>
                <a href={`/admin/orders/${order.orderId}`} className={styles.link}>
                  {order.orderId}
                </a>
              </td>
              <td>{order.shipping.name}</td>
              <td>{new Intl.NumberFormat('ko-KR').format(order.totalAmount)}원</td>
              <td>
                <span className={`${styles.badge} ${styles[`badge_${order.status}`]}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </td>
              <td>{order.paymentMethod ?? '-'}</td>
              <td>{new Date(order.createdAt).toLocaleDateString('ko-KR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
```

**Step 3: Create admin styles**

Create `src/app/admin/admin.module.css`:
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #222;
}

.title {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.count {
  font-size: 14px;
  color: #888;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid #333;
  color: #888;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.table td {
  padding: 14px 16px;
  border-bottom: 1px solid #1a1a1a;
}

.table tr:hover td {
  background: #111;
}

.link {
  color: #4dabf7;
  text-decoration: none;
  font-family: monospace;
  font-size: 13px;
}

.link:hover {
  text-decoration: underline;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge_pending { background: #333; color: #aaa; }
.badge_paid { background: #1a3a2a; color: #4ade80; }
.badge_failed { background: #3a1a1a; color: #f87171; }
.badge_preparing { background: #3a3a1a; color: #facc15; }
.badge_shipped { background: #1a2a3a; color: #60a5fa; }
.badge_delivered { background: #1a3a2a; color: #34d399; }
.badge_cancelled { background: #2a1a1a; color: #888; }
```

**Step 4: Commit**

```bash
git add src/app/admin/
git commit -m "feat: add admin orders dashboard"
```

---

## Task 12: Admin Order Detail Page (Status Management)

**Files:**
- Create: `src/app/admin/orders/[orderId]/page.tsx`
- Create: `src/app/api/admin/orders/[orderId]/route.ts`

**Step 1: Create admin order status update API**

Create `src/app/api/admin/orders/[orderId]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getOrder, updateOrder } from '@/lib/order-storage';
import { sendAlimtalk } from '@/lib/kakao-alimtalk';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const { status, trackingNumber } = await request.json();

  const order = await getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
  }

  const updated = await updateOrder(orderId, { status });
  if (!updated) {
    return NextResponse.json({ error: '업데이트 실패' }, { status: 500 });
  }

  // 배송 시작 시 알림톡 발송
  if (status === 'shipped' && order.status !== 'shipped') {
    sendAlimtalk('shipping_started', {
      orderId,
      name: order.shipping.name,
      phone: order.shipping.phone,
      totalAmount: order.totalAmount,
      trackingNumber,
    }).catch(err => console.error('[admin] AlimTalk failed:', err));
  }

  return NextResponse.json(updated);
}
```

**Step 2: Create admin order detail page**

Create `src/app/admin/orders/[orderId]/page.tsx`:
```tsx
import { getOrder } from '@/lib/order-storage';
import { notFound } from 'next/navigation';
import OrderDetailClient from './OrderDetailClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order) notFound();

  return <OrderDetailClient order={order} />;
}
```

**Step 3: Create the client component for status updates**

Create `src/app/admin/orders/[orderId]/OrderDetailClient.tsx`:
```tsx
'use client';

import { useState } from 'react';
import type { Order } from '@/types/order';

const STATUSES = ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: '결제 대기',
  paid: '결제 완료',
  failed: '결제 실패',
  preparing: '상품 준비',
  shipped: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소',
};

export default function OrderDetailClient({ order: initialOrder }: { order: Order }) {
  const [order, setOrder] = useState(initialOrder);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  async function handleStatusChange(newStatus: string) {
    setUpdating(true);
    const res = await fetch(`/api/admin/orders/${order.orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, trackingNumber }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
    }
    setUpdating(false);
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <a href="/admin" style={{ color: '#4dabf7', fontSize: 14 }}>&larr; 주문 목록</a>

      <h1 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.05em', margin: '24px 0 32px' }}>
        주문 {order.orderId}
      </h1>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, color: '#888', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>상태 변경</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={updating || order.status === s}
              style={{
                padding: '8px 16px',
                background: order.status === s ? '#fff' : '#222',
                color: order.status === s ? '#000' : '#ccc',
                border: 'none',
                cursor: order.status === s ? 'default' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="운송장 번호 (배송 시작 시)"
          value={trackingNumber}
          onChange={e => setTrackingNumber(e.target.value)}
          style={{
            padding: '10px 14px',
            background: '#111',
            border: '1px solid #333',
            color: '#fff',
            width: 300,
            fontSize: 14,
          }}
        />
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, color: '#888', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>주문 정보</h2>
        <table style={{ fontSize: 14, borderCollapse: 'collapse' }}>
          <tbody>
            {[
              ['상태', STATUS_LABELS[order.status]],
              ['결제금액', `${new Intl.NumberFormat('ko-KR').format(order.totalAmount)}원`],
              ['결제수단', order.paymentMethod ?? '-'],
              ['결제일시', order.paidAt ? new Date(order.paidAt).toLocaleString('ko-KR') : '-'],
              ['주문일시', new Date(order.createdAt).toLocaleString('ko-KR')],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ padding: '8px 24px 8px 0', color: '#888' }}>{label}</td>
                <td style={{ padding: '8px 0' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, color: '#888', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>배송 정보</h2>
        <table style={{ fontSize: 14, borderCollapse: 'collapse' }}>
          <tbody>
            {[
              ['받는분', order.shipping.name],
              ['연락처', order.shipping.phone],
              ['주소', `${order.shipping.address} ${order.shipping.addressDetail}`],
              ['우편번호', order.shipping.postalCode],
              ['메모', order.shipping.memo || '-'],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ padding: '8px 24px 8px 0', color: '#888' }}>{label}</td>
                <td style={{ padding: '8px 0' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 style={{ fontSize: 14, color: '#888', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>주문 상품</h2>
        {order.items.map((item, i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #1a1a1a', fontSize: 14 }}>
            <div style={{ fontWeight: 600 }}>{item.productTitle}</div>
            <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
              {item.size} / {item.frame === 'none' ? '프린트만' : item.frame} / {item.quantity}개
            </div>
            <div style={{ marginTop: 4 }}>
              {new Intl.NumberFormat('ko-KR').format((item.printPrice + item.framePrice) * item.quantity)}원
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
```

**Step 4: Commit**

```bash
git add src/app/admin/orders/ src/app/api/admin/
git commit -m "feat: add admin order detail page with status management"
```

---

## Task 13: Re-enable Checkout Page

**Files:**
- Modify: `src/app/checkout/page.tsx`

**Step 1: Restore the checkout page**

This is a significant change. The current page shows a maintenance message. We need to restore the full checkout form with shipping info fields and the Toss Payment Widget.

Replace the entire `src/app/checkout/page.tsx` with:
```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useCartStore } from '@/lib/cart-store';
import { formatKRW } from '@/lib/format';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './checkout.module.css';

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? '';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, getTotalPrice } = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Shipping form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const totalPrice = mounted ? getTotalPrice() : 0;
  const shippingFee = totalPrice >= 50000 ? 0 : 3500;
  const grandTotal = totalPrice + shippingFee;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // 1. 서버에 주문 생성
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          shipping: { name, phone, postalCode, address, addressDetail, memo },
          subtotal: totalPrice,
          shippingFee,
          totalAmount: grandTotal,
        }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.error ?? '주문 생성에 실패했습니다.');
      }

      const { orderId, totalAmount } = await orderRes.json();

      // 2. 토스페이먼츠 결제 요청
      if (!CLIENT_KEY) throw new Error('결제 설정이 올바르지 않습니다.');

      const tossPayments = await loadTossPayments(CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: `cust-${Date.now()}` });

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: totalAmount },
        orderId,
        orderName: items.length === 1
          ? items[0].productTitle
          : `${items[0].productTitle} 외 ${items.length - 1}건`,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerName: name,
        customerMobilePhone: phone.replace(/[^0-9]/g, ''),
      });
    } catch (err) {
      if (err instanceof Error) {
        // 사용자가 결제창을 닫은 경우 무시
        if (err.message.includes('PAY_PROCESS_CANCELED') || err.message.includes('USER_CANCEL')) {
          setSubmitting(false);
          return;
        }
        setError(err.message);
      }
      setSubmitting(false);
    }
  }, [items, name, phone, postalCode, address, addressDetail, memo, totalPrice, shippingFee, grandTotal]);

  if (!mounted) return null;

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <main>
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '장바구니', href: '/cart' }, { label: '주문/결제' }]} />
      <div className={styles.container}>
        <h1 className={styles.title}>CHECKOUT</h1>

        <form onSubmit={handleSubmit} className={styles.layout}>
          {/* Shipping Form */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>배송 정보</h2>

            <div className={styles.field}>
              <label className={styles.label}>받는 분 *</label>
              <input
                type="text"
                className={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="이름"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>연락처 *</label>
              <input
                type="tel"
                className={styles.input}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                placeholder="010-1234-5678"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>우편번호 *</label>
              <input
                type="text"
                className={styles.input}
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                required
                placeholder="우편번호"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>주소 *</label>
              <input
                type="text"
                className={styles.input}
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
                placeholder="기본 주소"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>상세주소</label>
              <input
                type="text"
                className={styles.input}
                value={addressDetail}
                onChange={e => setAddressDetail(e.target.value)}
                placeholder="상세 주소"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>배송 메모</label>
              <textarea
                className={styles.textarea}
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="배송 시 요청사항"
                rows={3}
              />
            </div>

            {error && <p className={styles.errorMessage}>{error}</p>}
          </div>

          {/* Order Summary */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>ORDER SUMMARY</h2>

            <div className={styles.summaryItems}>
              {items.map(item => (
                <div key={item.id} className={styles.summaryItem}>
                  <Image
                    src={item.productImage}
                    alt={item.productTitle}
                    width={60}
                    height={75}
                    className={styles.summaryItemImg}
                  />
                  <div className={styles.summaryItemInfo}>
                    <div className={styles.summaryItemName}>{item.productTitle}</div>
                    <div className={styles.summaryItemMeta}>
                      {item.size} / {item.frame === 'none' ? '프린트' : item.frame}
                    </div>
                    <div className={styles.summaryItemPrice}>
                      {formatKRW((item.printPrice + item.framePrice) * item.quantity)} × {item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summaryRow}>
              <span>상품 금액</span>
              <span>{formatKRW(totalPrice)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>배송비</span>
              <span>{shippingFee === 0 ? '무료' : formatKRW(shippingFee)}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>결제 금액</span>
              <span>{formatKRW(grandTotal)}</span>
            </div>

            <button
              type="submit"
              className={styles.payBtn}
              disabled={submitting}
            >
              {submitting ? '처리 중...' : `${formatKRW(grandTotal)} 결제하기`}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
```

**Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/checkout/page.tsx
git commit -m "feat: re-enable checkout with shipping form and Toss payment flow"
```

---

## Task 14: Update Environment Variables on Vercel

**This is a manual step — no code changes.**

Go to Vercel Dashboard → silver-tape project → Settings → Environment Variables and set:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# TossPayments (LIVE keys)
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_...
TOSS_SECRET_KEY=live_sk_...

# Solapi
SOLAPI_API_KEY=...
SOLAPI_API_SECRET=...
SOLAPI_PFID=@silvertape (카카오 채널 ID)
SOLAPI_SENDER=0XX-XXXX-XXXX
SOLAPI_TPL_ORDER_COMPLETE=KA01TPxxxxxx
SOLAPI_TPL_DEPOSIT_CONFIRMED=KA01TPxxxxxx
SOLAPI_TPL_SHIPPING_STARTED=KA01TPxxxxxx

# Sentry
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=silvertape
SENTRY_PROJECT=silvertape-web

# Admin
ADMIN_EMAILS=minho@example.com

# Meta (existing — verify these are set)
NEXT_PUBLIC_META_PIXEL_ID=1214485590845242
META_PIXEL_ID=1214485590845242
META_ACCESS_TOKEN=...
```

---

## Task 15: Register Toss Webhook URL

**This is a manual step — no code changes.**

1. Go to [토스페이먼츠 개발자센터](https://developers.tosspayments.com/)
2. Navigate to: 개발 정보 → 웹훅
3. Register webhook URL: `https://silvertape.art/api/toss-webhook`
4. Select events: `PAYMENT_STATUS_CHANGED`, `DEPOSIT_CALLBACK`
5. Save

---

## Task 16: Register Solapi AlimTalk Templates

**This is a manual step — no code changes.**

1. Create Solapi account at [solapi.com](https://solapi.com/)
2. Link your Kakao Business Channel
3. Create templates:

**Template 1 — 주문 완료 (order_complete):**
```
#{고객명}님, 주문이 완료되었습니다.

주문번호: #{주문번호}
결제금액: #{결제금액}

제작 시작 후 영업일 기준 2-4일 이내 출고됩니다.
문의: hello@silvertape.art
```

**Template 2 — 배송 시작 (shipping_started):**
```
#{고객명}님, 주문하신 상품이 발송되었습니다.

주문번호: #{주문번호}
운송장번호: #{운송장번호}

배송 조회: https://tracker.delivery/...
문의: hello@silvertape.art
```

4. Submit templates for Kakao review (1-2 business days)
5. Once approved, copy template IDs into Vercel env vars

---

## Task 17: End-to-End Testing

**Step 1: Test with Toss test keys locally**

Set `.env.local` with test keys:
```
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
```

Run: `npm run dev`

Test flow:
1. Add item to cart → go to checkout
2. Fill shipping info → click payment button
3. Complete test payment in Toss sandbox
4. Verify redirect to `/checkout/success`
5. Verify order appears in Supabase `orders` table with status `paid`

**Step 2: Test webhook**

Use Toss developer dashboard webhook test feature to send a test event.
Verify order status updates in Supabase.

**Step 3: Test admin panel**

1. Create admin user in Supabase Dashboard → Authentication → Users
2. Navigate to `/admin/login`
3. Login with admin credentials
4. Verify orders list appears
5. Test status change on an order

**Step 4: Deploy and test with live keys**

Push to main → Vercel auto-deploys → test with a real ₩100 payment → refund after.

---

## Summary: File Changes

**New files (10):**
| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client |
| `src/lib/kakao-alimtalk.ts` | AlimTalk via Solapi |
| `src/app/api/toss-webhook/route.ts` | Toss webhook |
| `src/app/admin/layout.tsx` | Admin layout |
| `src/app/admin/page.tsx` | Orders dashboard |
| `src/app/admin/admin.module.css` | Admin styles |
| `src/app/admin/login/page.tsx` | Admin login |
| `src/app/admin/login/login.module.css` | Login styles |
| `src/app/admin/orders/[orderId]/page.tsx` | Order detail (server) |
| `src/app/admin/orders/[orderId]/OrderDetailClient.tsx` | Order detail (client) |
| `src/app/api/admin/orders/[orderId]/route.ts` | Admin order API |
| `sentry.client.config.ts` | Sentry client |
| `sentry.server.config.ts` | Sentry server |
| `sentry.edge.config.ts` | Sentry edge |
| `supabase/migrations/001_orders.sql` | DB schema |

**Modified files (5):**
| File | Change |
|------|--------|
| `src/lib/order-storage.ts` | Filesystem → Supabase |
| `src/lib/toss-payments.ts` | Add payment lookup helper |
| `src/app/api/payment/confirm/route.ts` | Add AlimTalk trigger |
| `src/app/checkout/page.tsx` | Re-enable with shipping form |
| `next.config.ts` | Add Sentry wrapper |
| `.env.example` | Add new env vars |

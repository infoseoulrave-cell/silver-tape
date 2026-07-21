# Silver-Tape 결제 시스템 프로덕션 완성 설계

**날짜:** 2026-03-04
**프로젝트:** silver-tape (silvertape.art)
**결제사:** 토스페이먼츠
**DB:** Supabase (PostgreSQL)
**알림:** 카카오 알림톡 (기존 비즈니스 채널 활용)
**모니터링:** Sentry

---

## 현재 상태

- Next.js 16 App Router, Vercel 배포
- 토스페이먼츠 연동 코드 존재하나 `PAYMENT_MAINTENANCE = true`로 비활성화
- 주문 데이터: Vercel `/tmp`에 JSON 파일 저장 (함수 재시작 시 소실)
- Webhook 없음 — 결제 확인이 클라이언트 트리거에만 의존
- 이메일/알림 없음 — UI에 "이메일 발송됩니다" 문구만 존재
- 관리자 페이지 없음
- 에러 모니터링 없음

## 아키텍처

```
고객 → /checkout → POST /api/orders → Supabase (pending)
                 → 토스 결제창
                     → 성공 → /checkout/success → POST /api/payment/confirm
                                                     → 토스 Confirm API
                                                     → Supabase (paid)
                                                     → 카카오 알림톡

토스 서버 → POST /api/toss-webhook → 서명 검증 → Supabase 상태 동기화

관리자 → /admin (Supabase Auth) → 주문 관리
Sentry → 모든 에러 추적
```

## DB 스키마

```sql
CREATE TABLE orders (
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
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

## Webhook

- Endpoint: `POST /api/toss-webhook`
- 서명 검증: `tosspayments-webhook-signature` 헤더, HMAC-SHA256
- 이벤트: `PAYMENT_STATUS_CHANGED`, `DEPOSIT_CALLBACK`
- 응답: 200 OK (실패 시 토스가 7번 재시도)

## 카카오 알림톡

- 기존 비즈니스 채널 활용
- 중계 플랫폼: Solapi 또는 직접 카카오 API
- 템플릿: 주문완료, 입금확인, 배송시작
- 템플릿 심사 필요 (1-2 영업일)

## 변경 파일

| 파일 | 변경 |
|------|------|
| `src/lib/order-storage.ts` | 파일 시스템 → Supabase |
| `src/lib/toss-payments.ts` | webhook 서명 검증 추가 |
| `src/app/checkout/page.tsx` | MAINTENANCE 해제, 결제 폼 복원 |
| `src/app/api/payment/confirm/route.ts` | 알림톡 트리거 추가 |

| 신규 파일 | 용도 |
|----------|------|
| `src/lib/supabase.ts` | Supabase 클라이언트 |
| `src/lib/kakao-alimtalk.ts` | 알림톡 발송 |
| `src/app/api/toss-webhook/route.ts` | Webhook endpoint |
| `src/app/admin/*` | 관리자 페이지 |
| `middleware.ts` | /admin 경로 보호 |
| `sentry.*.config.ts` | Sentry 설정 |

## 환경변수 (Vercel 대시보드 설정)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# TossPayments
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_...
TOSS_SECRET_KEY=live_sk_...

# 카카오 알림톡 (Solapi)
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
KAKAO_PFID=           # 카카오 채널 ID
KAKAO_TEMPLATE_IDS=   # 템플릿 ID들

# Sentry
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Meta (기존)
NEXT_PUBLIC_META_PIXEL_ID=
META_PIXEL_ID=
META_ACCESS_TOKEN=
```

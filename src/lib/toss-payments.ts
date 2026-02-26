/**
 * TossPayments SDK initialization utility
 *
 * Client key: NEXT_PUBLIC_TOSS_CLIENT_KEY (브라우저 노출 OK)
 * Secret key: TOSS_SECRET_KEY (서버에서만 사용)
 *
 * 테스트 키: test_ck_* / test_sk_*
 * 프로덕션: live_ck_* / live_sk_*
 */

export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? '';
export const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY ?? '';

export function getTossAuthHeader(): string {
  return `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`;
}

export const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';

export function isTossConfigured(): boolean {
  return TOSS_CLIENT_KEY.length > 0 && TOSS_SECRET_KEY.length > 0;
}

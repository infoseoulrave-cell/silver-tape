import 'server-only';
import type { TossPaymentResponse } from '@/types/order';

export const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY ?? '';

export function getTossAuthHeader(): string {
  return `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`;
}

export const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';
export const TOSS_PAYMENT_URL = 'https://api.tosspayments.com/v1/payments';

export function isTossConfigured(): boolean {
  return TOSS_SECRET_KEY.length > 0;
}

/**
 * Fetch payment details from Toss API to verify webhook data.
 */
export async function getTossPayment(paymentKey: string): Promise<TossPaymentResponse | null> {
  const res = await fetch(`${TOSS_PAYMENT_URL}/${paymentKey}`, {
    headers: { 'Authorization': getTossAuthHeader() },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Format a number as Korean Won currency string
 */
export function formatKRW(amount: number): string {
  return `\u20A9${amount.toLocaleString('ko-KR')}`;
}

/**
 * Format price with HTML entity for Won sign
 */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}`;
}

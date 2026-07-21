export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? '';

export function isTossClientConfigured(): boolean {
  return TOSS_CLIENT_KEY.length > 0;
}

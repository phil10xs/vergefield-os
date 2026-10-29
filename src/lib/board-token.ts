export const BOARD_TOKEN_TTL_MS = 7 * 24 * 3600 * 1000;

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isBoardTokenLive(
  expiresAt: Date,
  now: Date = new Date(),
): boolean {
  return expiresAt.getTime() > now.getTime();
}

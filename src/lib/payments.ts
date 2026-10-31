const MAX_AMOUNT_PENCE = 10_000_000;

/** Parses a pounds input into integer pence. Throws on anything invalid. */
export function parsePoundsToPence(raw: string | null): number {
  const text = raw?.trim() ?? "";
  if (!text) throw new Error("Enter a valid amount");
  const pounds = Number(text);
  if (!Number.isFinite(pounds) || pounds <= 0) {
    throw new Error("Enter a valid amount");
  }
  const pence = Math.round(pounds * 100);
  if (!Number.isInteger(pence) || pence <= 0 || pence > MAX_AMOUNT_PENCE) {
    throw new Error("Enter a valid amount");
  }
  return pence;
}

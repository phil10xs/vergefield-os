import type { Job } from "@/db/schema";

export const BOARD_TOKEN_TTL_MS = 7 * 24 * 3600 * 1000;

/** Opaque token. Hex links already sent and new base64url tokens both match. */
export function isBoardTokenShape(token: string): boolean {
  return /^[A-Za-z0-9_-]{16,128}$/.test(token);
}

export function normalizeContact(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Properties on a landlord link: every check-in with the link email, plus
 * check-ins that share the contact of the visit the link was requested from
 * (so a phone check-in still opens when the link is emailed to a real inbox).
 * This does not consult a password.
 */
export function jobsForLandlord(
  jobs: Job[],
  access: { email: string; anchorContact?: string | null },
): Job[] {
  const keys = new Set<string>();
  if (access.email.trim()) keys.add(normalizeContact(access.email));
  const anchor = access.anchorContact?.trim();
  if (anchor) keys.add(normalizeContact(anchor));
  if (keys.size === 0) return [];
  return jobs.filter((row) => {
    const contact = row.requesterContact?.trim();
    return Boolean(contact && keys.has(normalizeContact(contact)));
  });
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** A phone, not an email. Digits with common separators, 7–15 numbers. */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("@")) return false;
  if (!/^[+()\d][\d\s().-]*$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export type LandlordContact = {
  kind: "email" | "phone";
  value: string;
};

/** Email gets a magic link. A phone still identifies the landlord. */
export function classifyLandlordContact(value: string): LandlordContact | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) {
    if (!isValidEmail(trimmed)) return null;
    return { kind: "email", value: normalizeContact(trimmed) };
  }
  if (!isValidPhone(trimmed)) return null;
  return { kind: "phone", value: normalizeContact(trimmed) };
}

export function isBoardTokenLive(
  expiresAt: Date,
  now: Date = new Date(),
): boolean {
  return expiresAt.getTime() > now.getTime();
}

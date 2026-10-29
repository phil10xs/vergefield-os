import { describe, expect, it } from "vitest";
import { isBoardTokenLive, isValidEmail } from "./board-token";

describe("isValidEmail", () => {
  it("accepts plain addresses and rejects junk", () => {
    expect(isValidEmail("jordan@example.com")).toBe(true);
    expect(isValidEmail("  jordan@example.com  ")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("jordan@com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isBoardTokenLive", () => {
  it("compares expiry against now", () => {
    const now = new Date("2026-10-29T12:00:00Z");
    expect(
      isBoardTokenLive(new Date("2026-10-30T12:00:00Z"), now),
    ).toBe(true);
    expect(
      isBoardTokenLive(new Date("2026-10-29T12:00:00Z"), now),
    ).toBe(false);
    expect(
      isBoardTokenLive(new Date("2026-10-28T12:00:00Z"), now),
    ).toBe(false);
  });
});

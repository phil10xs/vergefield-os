import { describe, expect, it } from "vitest";
import { parsePoundsToPence } from "./payments";

describe("parsePoundsToPence", () => {
  it("converts pounds to pence", () => {
    expect(parsePoundsToPence("45")).toBe(4500);
    expect(parsePoundsToPence("45.50")).toBe(4550);
    expect(parsePoundsToPence(" 12.5 ")).toBe(1250);
    expect(parsePoundsToPence("0.99")).toBe(99);
    expect(parsePoundsToPence("100000")).toBe(10000000);
  });

  it("rejects missing or invalid amounts", () => {
    const bad: Array<string | null> = [
      null,
      "",
      "   ",
      "abc",
      "£45",
      "0",
      "0.00",
      "-5",
      "100000.01",
    ];
    for (const raw of bad) {
      expect(() => parsePoundsToPence(raw)).toThrow("Enter a valid amount");
    }
  });
});

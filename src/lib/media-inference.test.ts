import { describe, expect, it } from "vitest";
import { buildTitle, inferTrade } from "./media-inference";

describe("inferTrade", () => {
  it.each([
    ["kitchen tap leaking under the sink", "Plumber"],
    ["fusebox keeps tripping", "Electrician"],
    ["broken wardrobe door hinge", "Carpenter"],
    ["boiler kettling, no hot water", "Heating engineer"],
    ["damp patch spreading on the wall", "Painter"],
    ["slipped slates after the storm", "Roofer"],
  ])("infers %s → %s", (text, trade) => {
    expect(inferTrade(text)).toBe(trade);
  });

  it("prefers an explicitly named trade", () => {
    expect(inferTrade("need a roofer, and the tap drips")).toBe("Roofer");
  });

  it("returns null when nothing matches", () => {
    expect(inferTrade("hello there")).toBeNull();
    expect(inferTrade("   ")).toBeNull();
  });
});

describe("buildTitle", () => {
  it("combines trade, short address, and lead phrase", () => {
    expect(
      buildTitle(
        "Plumber",
        "12 Rosebank Road, Manchester",
        "Kitchen tap leaking. Worse at night.",
      ),
    ).toBe("Plumber request — 12 Rosebank Road: Kitchen tap leaking");
  });

  it("falls back to General and Site", () => {
    expect(buildTitle(null, "", "")).toBe("General request — Site");
  });
});

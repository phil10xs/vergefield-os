import { describe, expect, it } from "vitest";
import { sectionText } from "./report-sections";
import type { ChecklistItem } from "@/db/schema";

function item(overrides: Partial<ChecklistItem>): ChecklistItem {
  return {
    id: "id",
    jobId: "job",
    section: "hazards",
    label: "Label",
    checked: false,
    note: null,
    sort: 0,
    ...overrides,
  };
}

describe("sectionText", () => {
  it("combines notes, counts, and follow-ups", () => {
    const text = sectionText(
      "hazards",
      "One open riser.",
      [
        item({ label: "No exposed wiring", checked: true, note: "Verified dead" }),
        item({ label: "Openings guarded", checked: false }),
      ],
      null,
    );
    expect(text).toContain("One open riser.");
    expect(text).toContain("Checklist: 1/2 complete.");
    expect(text).toContain("Follow up: Openings guarded");
    expect(text).toContain("No exposed wiring — Verified dead");
  });

  it("adds site notes only to the site condition section", () => {
    const items = [item({ section: "site_condition", checked: true })];
    expect(sectionText("site_condition", null, items, "Heard a drip")).toContain(
      "Site notes: Heard a drip",
    );
    expect(
      sectionText("materials", null, items, "Heard a drip"),
    ).not.toContain("Site notes");
  });
});

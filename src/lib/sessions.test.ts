import { describe, expect, it } from "vitest";
import {
  condenseTranscript,
  excerptWords,
  formatPounds,
  formatVisitDay,
  groupSessionsByPropertyVisit,
  inferIssue,
  nameIssue,
  selectVisitSessions,
} from "./sessions";
import type { Job } from "@/db/schema";

function job(overrides: Partial<Job>): Job {
  return {
    id: "id",
    title: "Title",
    siteName: null,
    status: "requested",
    priority: "medium",
    assignee: null,
    tradesmanName: null,
    tradesmanTrade: null,
    source: "internal",
    requesterName: null,
    requesterContact: null,
    businessName: null,
    propertyAddress: null,
    paymentStatus: "none",
    paymentAmount: null,
    notes: null,
    createdAt: new Date("2026-10-28T10:00:00Z"),
    updatedAt: new Date("2026-10-28T10:00:00Z"),
    ...overrides,
  };
}

describe("groupSessionsByPropertyVisit", () => {
  it("groups by address then visit day", () => {
    const groups = groupSessionsByPropertyVisit([
      job({ id: "a", propertyAddress: "My House", createdAt: new Date("2026-10-28T10:00:00Z") }),
      job({ id: "b", propertyAddress: "My House", createdAt: new Date("2026-10-28T15:00:00Z") }),
      job({ id: "c", propertyAddress: "My House", createdAt: new Date("2026-10-26T10:00:00Z") }),
      job({ id: "d", siteName: "Hulme Point", createdAt: new Date("2026-10-28T10:00:00Z") }),
    ]);
    expect(groups.map((group) => group.address)).toEqual([
      "Hulme Point",
      "My House",
    ]);
    const home = groups[1]!;
    expect(home.sessionCount).toBe(3);
    expect(home.visits.map((visit) => visit.sessions.map((s) => s.id))).toEqual([
      ["a", "b"],
      ["c"],
    ]);
  });

  it("falls back for missing addresses and empty input", () => {
    expect(groupSessionsByPropertyVisit([])).toEqual([]);
    const [group] = groupSessionsByPropertyVisit([job({})]);
    expect(group!.address).toBe("Unassigned site");
  });
});

describe("selectVisitSessions", () => {
  it("returns same-address same-day sessions in time order", () => {
    const anchor = job({
      id: "a",
      propertyAddress: "My House",
      createdAt: new Date("2026-10-28T12:00:00Z"),
    });
    const rows = [
      job({
        id: "b",
        propertyAddress: "My House",
        createdAt: new Date("2026-10-28T15:00:00Z"),
      }),
      job({
        id: "c",
        propertyAddress: "My House",
        createdAt: new Date("2026-10-26T10:00:00Z"),
      }),
      job({
        id: "d",
        siteName: "Other Site",
        createdAt: new Date("2026-10-28T10:00:00Z"),
      }),
      anchor,
    ];
    expect(selectVisitSessions(rows, anchor).map((row) => row.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("matches the grouping fallback for missing addresses", () => {
    const anchor = job({});
    expect(selectVisitSessions([anchor], anchor)).toEqual([anchor]);
  });
});

describe("formatVisitDay", () => {
  it("labels a day in en-GB short form", () => {
    expect(formatVisitDay("2026-10-28")).toBe("Wed 28 Oct");
  });
});

describe("excerptWords", () => {
  it("caps long text at a word boundary with an ellipsis", () => {
    expect(excerptWords("one two three four", 3)).toBe("one two three …");
    expect(excerptWords("one two", 5)).toBe("one two");
  });
});

describe("inferIssue", () => {
  it("prefers a written note, else heard, else seen", () => {
    expect(inferIssue("Leaking tap", ["drip"], ["stain"])).toBe("Leaking tap");
    expect(inferIssue(null, ["tap drips loudly"], ["wet patch"])).toBe(
      "tap drips loudly",
    );
    expect(inferIssue("See photos and video.", [], ["wet patch"])).toBe(
      "wet patch",
    );
    expect(inferIssue(null, [], [])).toBe("See photos and video.");
  });
});

describe("nameIssue", () => {
  it("names place + problem in a few words", () => {
    expect(nameIssue("And yes my garden looks a bit weedy", null)).toBe(
      "Weedy Garden",
    );
    expect(
      nameIssue("My bathroom, the glass just by the bathtub has mould", "Painter"),
    ).toBe("Mouldy Bathroom");
    expect(
      nameIssue("Yes my cupboard is broken just fell off", "Carpenter"),
    ).toBe("Broken Cupboard");
    expect(nameIssue("The tap is dripping all night", "Plumber")).toBe(
      "Leaking Tap",
    );
  });
  it("falls back gracefully", () => {
    expect(nameIssue("damp everywhere", null)).toBe("Damp");
    expect(nameIssue("my garden needs work", null)).toBe("Garden issue");
    expect(nameIssue("", "Plumber")).toBe("Plumber issue");
    expect(nameIssue("", null)).toBe("Reported issue");
  });
});

describe("condenseTranscript", () => {
  it("strips fillers and repeats, caps length", () => {
    expect(
      condenseTranscript(
        "Yes my cupboard cupboard is broken uh just just fell off yesterday",
      ),
    ).toBe("Yes my cupboard is broken just fell off yesterday");
    expect(condenseTranscript("It is, you know, leaking badly")).toBe(
      "It is, leaking badly",
    );
    expect(condenseTranscript("one two three four five", 3)).toBe(
      "one two three …",
    );
  });
});

describe("formatPounds", () => {
  it("formats pence compactly", () => {
    expect(formatPounds(12000)).toBe("£120");
    expect(formatPounds(1845)).toBe("£18.45");
  });
});

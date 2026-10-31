import { describe, expect, it } from "vitest";
import {
  classifyLandlordContact,
  isBoardTokenLive,
  isValidEmail,
  isValidPhone,
  jobsForLandlord,
} from "./board-token";
import type { Job } from "@/db/schema";

describe("isValidEmail", () => {
  it("accepts plain addresses and rejects junk", () => {
    expect(isValidEmail("jordan@example.com")).toBe(true);
    expect(isValidEmail("  jordan@example.com  ")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("jordan@com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("classifyLandlordContact", () => {
  it("treats an email as a magic-link contact and a phone as phone-only", () => {
    expect(classifyLandlordContact("  Jordan@Example.com ")).toEqual({
      kind: "email",
      value: "jordan@example.com",
    });
    expect(classifyLandlordContact("07123 888888")).toEqual({
      kind: "phone",
      value: "07123 888888",
    });
    expect(isValidPhone("07123 888888")).toBe(true);
    expect(classifyLandlordContact("not-a-contact")).toBeNull();
    expect(classifyLandlordContact("jordan@com")).toBeNull();
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
    severity: null,
    costBand: null,
    source: "public",
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

describe("jobsForLandlord", () => {
  it("includes every property for the link email and the anchor contact", () => {
    const jobs = [
      job({
        id: "a",
        requesterContact: "Priya@Example.com",
        propertyAddress: "Hulme Point",
      }),
      job({
        id: "b",
        requesterContact: "priya@example.com",
        propertyAddress: "Salford Quays",
      }),
      job({
        id: "c",
        requesterContact: "07123 888888",
        propertyAddress: "14 Rosebank Road",
      }),
      job({
        id: "d",
        requesterContact: "tom@example.com",
        propertyAddress: "Other",
      }),
    ];
    const owned = jobsForLandlord(jobs, {
      email: "priya@example.com",
      anchorContact: "07123 888888",
    });
    expect(owned.map((row) => row.id).sort()).toEqual(["a", "b", "c"]);
  });
});

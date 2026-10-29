import { describe, expect, it } from "vitest";
import { parseJobMessage } from "./chat-parse";

describe("parseJobMessage", () => {
  it("extracts site, assignee, priority, and trade", () => {
    const draft = parseJobMessage(
      "Create job: second-fix electrics at Hulme Point for Ama Mensah, urgent, needs an electrician",
    );
    expect(draft.title).toBe("Second-fix electrics needs an electrician");
    expect(draft.siteName).toBe("Hulme Point");
    expect(draft.assignee).toBe("Ama Mensah");
    expect(draft.priority).toBe("high");
    expect(draft.trade).toBe("Electrician");
  });

  it("handles assign-to phrasing with low priority", () => {
    const draft = parseJobMessage(
      "Log a job — snagging walk on Block B, assign to J. Whitfield, low priority",
    );
    expect(draft.siteName).toBe("Block B");
    expect(draft.assignee).toBe("J. Whitfield");
    expect(draft.priority).toBe("low");
  });

  it("defaults to medium priority", () => {
    const draft = parseJobMessage("Commission MVHR on Plot 8");
    expect(draft.siteName).toBe("Plot 8");
    expect(draft.priority).toBe("medium");
    expect(draft.title).toBe("Commission MVHR");
  });

  it("rejects weekdays as site names and captures notes", () => {
    const draft = parseJobMessage("Snagging walk on Friday, note: client attending");
    expect(draft.siteName).toBeNull();
    expect(draft.notes).toBe("client attending");
    expect(draft.title).toContain("Friday");
  });

  it("falls back to the raw message when nothing parses", () => {
    const draft = parseJobMessage("hello");
    expect(draft.title).toBe("Hello");
    expect(draft.priority).toBe("medium");
  });
});

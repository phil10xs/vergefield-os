import { describe, expect, it, vi } from "vitest";

const queued: Array<() => Promise<unknown>> = [];

vi.mock("next/server", () => ({
  after: (task: () => Promise<unknown>) => {
    queued.push(task);
  },
}));

describe("queueBoardLinkSend", () => {
  it("schedules the send instead of running it inline", async () => {
    queued.length = 0;
    const { queueBoardLinkSend } = await import("./schedule-send");
    let ran = false;
    queueBoardLinkSend(async () => {
      ran = true;
    });
    expect(ran).toBe(false);
    expect(queued).toHaveLength(1);
    await queued[0]();
    expect(ran).toBe(true);
  });
});

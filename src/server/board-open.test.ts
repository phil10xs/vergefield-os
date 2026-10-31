import { describe, expect, it } from "vitest";
import { startBoardEmail } from "./board-open";

describe("startBoardEmail", () => {
  const base = {
    email: "landlord@acme.co",
    propertiesUrl: "https://vergesnag.goverge.app/b/tok",
    recipientName: "Jordan",
  };

  it("returns the board decision before the send runs", async () => {
    let release: () => void = () => {};
    const hung = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tasks: Array<() => Promise<void>> = [];
    let sent = false;
    const result = startBoardEmail({
      ...base,
      configured: true,
      blocked: false,
      alreadySent: false,
      queue: (task) => {
        tasks.push(task);
      },
      send: async () => {
        await hung;
        sent = true;
      },
    });
    expect(result.emailStatus).toBe("scheduled");
    expect(sent).toBe(false);
    expect(tasks).toHaveLength(1);
    release();
    await tasks[0]();
    expect(sent).toBe(true);
  });

  it("does not queue a send when SES is not configured", () => {
    const tasks: unknown[] = [];
    const result = startBoardEmail({
      ...base,
      configured: false,
      blocked: false,
      alreadySent: false,
      queue: (task) => tasks.push(task),
      send: async () => {
        throw new Error("should not send");
      },
    });
    expect(result.emailStatus).toBe("skipped_not_configured");
    expect(result.message).toMatch(/SES_FROM_EMAIL/);
    expect(tasks).toHaveLength(0);
  });

  it("still reports a path-side failure without throwing", () => {
    const result = startBoardEmail({
      ...base,
      configured: true,
      blocked: false,
      alreadySent: false,
      queue: () => {
        throw new Error("schedule failed");
      },
      send: async () => undefined,
    });
    expect(result.emailStatus).toBe("failed");
  });

  it("second property does not send", () => {
    const tasks: unknown[] = [];
    const result = startBoardEmail({
      ...base,
      configured: true,
      blocked: false,
      alreadySent: true,
      queue: (task) => tasks.push(task),
      send: async () => {
        throw new Error("should not send");
      },
    });
    expect(result.emailStatus).toBe("already_sent");
    expect(result.message).toMatch(/existing list/);
    expect(result.message).not.toMatch(/Sending/);
    expect(tasks).toHaveLength(0);
  });

  it("still sends the first time when no live link was emailed", () => {
    const tasks: unknown[] = [];
    const result = startBoardEmail({
      ...base,
      configured: true,
      blocked: false,
      alreadySent: false,
      queue: (task) => tasks.push(task),
      send: async () => undefined,
    });
    expect(result.emailStatus).toBe("scheduled");
    expect(tasks).toHaveLength(1);
  });
});

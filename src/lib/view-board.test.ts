import { describe, expect, it } from "vitest";
import {
  BOARD_MOVE_HINT,
  boardConfettiKind,
  boardEmailNotice,
  runViewBoardClick,
  snagListDescription,
  viewBoardHelperText,
} from "./view-board";
import type { BoardOpenResult } from "./view-board";

const opened: BoardOpenResult = {
  boardPath: "/b/tok/p/key/board",
  propertiesUrl: "https://vergesnag.goverge.app/b/tok",
  email: "landlord@acme.co",
  emailStatus: "scheduled",
  message: "Sending your properties link.",
};

describe("runViewBoardClick", () => {
  it("opens the email path before navigating", async () => {
    const order: string[] = [];
    await runViewBoardClick({
      open: async () => {
        order.push("open");
        return opened;
      },
      navigate: () => {
        order.push("navigate");
      },
    });
    expect(order).toEqual(["open", "navigate"]);
  });

  it("navigates when the email could not be started", async () => {
    const paths: string[] = [];
    const outcome = await runViewBoardClick({
      open: async () => ({ ...opened, emailStatus: "failed", message: "nope" }),
      navigate: (path) => {
        paths.push(path);
      },
    });
    expect(paths).toEqual(["/b/tok/p/key/board?email=failed&celebrate=1"]);
    expect(outcome.navigated).toBe(true);
  });

  it("navigates when email is not configured", async () => {
    let path = "";
    const outcome = await runViewBoardClick({
      open: async () => ({
        ...opened,
        emailStatus: "skipped_not_configured",
        message: "unset",
      }),
      navigate: (next) => {
        path = next;
      },
    });
    expect(outcome.navigated).toBe(true);
    expect(path).toContain("email=skipped_not_configured");
    expect(path).toContain("celebrate=1");
  });

  it("keeps the email queued when navigation throws", async () => {
    let openedCall = false;
    const outcome = await runViewBoardClick({
      open: async () => {
        openedCall = true;
        return opened;
      },
      navigate: () => {
        throw new Error("nav failed");
      },
    });
    expect(openedCall).toBe(true);
    expect(outcome.navigated).toBe(false);
    expect(outcome.navError).toMatch(/still being sent/);
    expect(outcome.href).toBe("/b/tok/p/key/board?email=scheduled&celebrate=1");
  });

  it("opens the board when no email was sent and does not claim one was", async () => {
    const paths: string[] = [];
    const outcome = await runViewBoardClick({
      open: async () => ({
        ...opened,
        email: "",
        emailStatus: "not_emailed",
        message: "No email was sent.",
      }),
      navigate: (path) => {
        paths.push(path);
      },
    });
    expect(paths).toEqual(["/b/tok/p/key/board?email=not_emailed&celebrate=1"]);
    expect(outcome.navigated).toBe(true);
    expect(boardEmailNotice("not_emailed")).toMatch(/No email was sent/);
    expect(boardEmailNotice("not_emailed")).not.toMatch(/Sending your properties link/);
  });

  it("second property does not send and opens the existing list", async () => {
    const paths: string[] = [];
    const outcome = await runViewBoardClick({
      open: async () => ({
        ...opened,
        emailStatus: "already_sent",
        message: "This property is on their existing list. No further email was sent.",
      }),
      navigate: (path) => {
        paths.push(path);
      },
    });
    expect(paths).toEqual([
      "/b/tok/p/key/board?email=already_sent&celebrate=1",
    ]);
    expect(outcome.navigated).toBe(true);
    const notice = boardEmailNotice("already_sent");
    expect(notice).toMatch(/existing list/);
    expect(notice).not.toMatch(/Sending/);
    expect(notice).toContain(BOARD_MOVE_HINT);
    expect(boardEmailNotice("skipped_not_configured")).toBe(
      `Email is not configured (SES_FROM_EMAIL), so nothing was sent. ${BOARD_MOVE_HINT}`,
    );
    expect(boardConfettiKind("1", "skipped_not_configured")).toBe("arrival");
    expect(boardConfettiKind("paid", undefined)).toBe("paid");
    expect(boardConfettiKind("1", undefined)).toBeNull();
    expect(boardConfettiKind(undefined, "scheduled")).toBeNull();
    const helper = viewBoardHelperText("landlord@acme.co", true);
    expect(helper).toMatch(/Opens this property's board/);
    expect(helper).toMatch(/existing list/);
    expect(helper).not.toMatch(/Emails/);
    expect(snagListDescription(true)).not.toMatch(/emails/i);
    expect(viewBoardHelperText("landlord@acme.co", false)).toMatch(
      /Emails landlord@acme.co/,
    );
  });
});

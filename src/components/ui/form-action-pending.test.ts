import { describe, expect, it } from "vitest";
import {
  INITIAL_FORM_ACTION_PENDING,
  isFormActionPending,
  isNextActionRequest,
  reduceFormActionPending,
} from "./form-action-pending";

describe("isNextActionRequest", () => {
  it("detects the Next-Action header on init", () => {
    expect(
      isNextActionRequest("/b/token", { headers: { "Next-Action": "abc" } }),
    ).toBe(true);
    expect(
      isNextActionRequest("/b/token", {
        headers: new Headers({ "next-action": "abc" }),
      }),
    ).toBe(true);
    expect(isNextActionRequest("/b/token", { headers: { Accept: "text/html" } })).toBe(
      false,
    );
  });
});

describe("reduceFormActionPending", () => {
  it("clears after the action finishes even if pending stays true", () => {
    let state = reduceFormActionPending(INITIAL_FORM_ACTION_PENDING, {
      type: "begin",
    });
    state = reduceFormActionPending(state, { type: "status", pending: true });
    expect(isFormActionPending(state, true)).toBe(true);

    state = reduceFormActionPending(state, { type: "idle" });
    expect(isFormActionPending(state, true)).toBe(false);

    state = reduceFormActionPending(state, { type: "status", pending: true });
    expect(isFormActionPending(state, true)).toBe(false);
  });

  it("starts a new submit after a stuck pending flag", () => {
    let state = reduceFormActionPending(INITIAL_FORM_ACTION_PENDING, {
      type: "begin",
    });
    state = reduceFormActionPending(state, { type: "idle" });
    state = reduceFormActionPending(state, { type: "begin" });
    expect(isFormActionPending(state, true)).toBe(true);
  });

  it("clears when pending reports idle", () => {
    let state = reduceFormActionPending(INITIAL_FORM_ACTION_PENDING, {
      type: "begin",
    });
    state = reduceFormActionPending(state, { type: "status", pending: true });
    state = reduceFormActionPending(state, { type: "status", pending: false });
    expect(isFormActionPending(state, false)).toBe(false);
  });
});

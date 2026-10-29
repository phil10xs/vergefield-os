import { describe, expect, it } from "vitest";
import { checkMediaSelection } from "./media-rules";

describe("checkMediaSelection", () => {
  it("allows photos and one short video", () => {
    expect(checkMediaSelection([])).toBeNull();
    expect(
      checkMediaSelection([{ kind: "photo" }, { kind: "photo" }]),
    ).toBeNull();
    expect(
      checkMediaSelection([
        { kind: "video", durationSeconds: 15 },
        { kind: "photo" },
      ]),
    ).toBeNull();
    expect(
      checkMediaSelection([{ kind: "video", durationSeconds: 20 }]),
    ).toBeNull();
  });

  it("rejects a second video", () => {
    expect(
      checkMediaSelection([
        { kind: "video", durationSeconds: 10 },
        { kind: "video", durationSeconds: 10 },
      ]),
    ).toBe("Please attach at most one video — add stills for the rest.");
  });

  it("rejects video over 20 seconds", () => {
    expect(
      checkMediaSelection([{ kind: "video", durationSeconds: 21 }]),
    ).toBe("Please keep the video to 20 seconds or less.");
  });
});

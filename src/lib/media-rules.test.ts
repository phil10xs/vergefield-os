import { describe, expect, it } from "vitest";
import { checkMediaSelection, groupFilesBySession } from "./media-rules";

describe("groupFilesBySession", () => {
  const file = (type: string, name: string) => ({ type, name });
  it("gives each video its own session, stills join the first", () => {
    expect(
      groupFilesBySession([
        file("video/mp4", "a.mp4"),
        file("image/png", "p1.png"),
        file("video/mp4", "b.mp4"),
        file("image/png", "p2.png"),
        file("video/mp4", "c.mp4"),
      ]).map((group) => group.map((entry) => entry.name)),
    ).toEqual([["a.mp4", "p1.png", "p2.png"], ["b.mp4"], ["c.mp4"]]);
  });
  it("keeps photo-only check-ins in one session", () => {
    expect(
      groupFilesBySession([file("image/png", "p.png")]).map((group) =>
        group.map((entry) => entry.name),
      ),
    ).toEqual([["p.png"]]);
    expect(groupFilesBySession([])).toEqual([]);
  });
});

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

  it("allows several short videos", () => {
    expect(
      checkMediaSelection([
        { kind: "video", durationSeconds: 10 },
        { kind: "video", durationSeconds: 20 },
        { kind: "video", durationSeconds: 5 },
        { kind: "photo" },
      ]),
    ).toBeNull();
  });

  it("rejects video over 20 seconds", () => {
    expect(
      checkMediaSelection([{ kind: "video", durationSeconds: 21 }]),
    ).toBe("Please keep the video to 20 seconds or less.");
  });

  it("rejects photos when videosOnly is set", () => {
    expect(
      checkMediaSelection([{ kind: "photo" }], { videosOnly: true }),
    ).toBe("Only videos are allowed — attach short video clips.");
    expect(
      checkMediaSelection(
        [
          { kind: "video", durationSeconds: 10 },
          { kind: "video", durationSeconds: 10 },
        ],
        { videosOnly: true },
      ),
    ).toBeNull();
  });

  it("rejects selections over 50 MB in total", () => {
    expect(
      checkMediaSelection([
        { kind: "video", durationSeconds: 10, sizeBytes: 30 * 1024 * 1024 },
        { kind: "video", durationSeconds: 10, sizeBytes: 30 * 1024 * 1024 },
      ]),
    ).toBe("Those files are over 50 MB in total — try fewer or shorter clips.");
    expect(
      checkMediaSelection([
        { kind: "video", durationSeconds: 10, sizeBytes: 20 * 1024 * 1024 },
        { kind: "photo", sizeBytes: 1024 },
      ]),
    ).toBeNull();
  });
});

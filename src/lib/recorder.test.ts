import { describe, expect, it } from "vitest";
import {
  RECORDER_AUDIO_BITS_PER_SECOND,
  RECORDER_VIDEO_BITS_PER_SECOND,
  pickRecorderMimeType,
  recorderFileExtension,
} from "./recorder";

describe("pickRecorderMimeType", () => {
  it("prefers mp4 with aac for iPhone Safari", () => {
    expect(pickRecorderMimeType(() => true)).toBe(
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    );
  });

  it("falls down the chain to webm", () => {
    expect(
      pickRecorderMimeType((mime) => mime === "video/webm"),
    ).toBe("video/webm");
  });

  it("returns undefined when nothing is supported", () => {
    expect(pickRecorderMimeType(() => false)).toBeUndefined();
  });

  it("treats probe throws as unsupported", () => {
    expect(
      pickRecorderMimeType((mime) => {
        if (mime === "video/webm") return true;
        throw new Error("nope");
      }),
    ).toBe("video/webm");
  });
});

describe("recorderFileExtension", () => {
  it("maps mp4 and webm", () => {
    expect(recorderFileExtension("video/mp4;codecs=avc1")).toBe("mp4");
    expect(recorderFileExtension("video/webm")).toBe("webm");
    expect(recorderFileExtension(undefined)).toBe("webm");
  });
});

describe("recorder budget", () => {
  it("caps a 20-second clip near 6 MB", () => {
    const bytes =
      ((RECORDER_VIDEO_BITS_PER_SECOND + RECORDER_AUDIO_BITS_PER_SECOND) *
        20) /
      8;
    expect(bytes).toBeLessThan(8 * 1024 * 1024);
  });
});

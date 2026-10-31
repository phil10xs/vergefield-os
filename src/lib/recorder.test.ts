import { describe, expect, it } from "vitest";
import {
  RECORDER_AUDIO_BITS_PER_SECOND,
  RECORDER_VIDEO_BITS_PER_SECOND,
  pickRecorderMimeType,
  recorderFileExtension,
  shouldUseNativeCapture,
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

describe("shouldUseNativeCapture", () => {
  const desktop = {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    maxTouchPoints: 0,
    coarsePointer: false,
  };

  it("uses the native camera on Android", () => {
    expect(
      shouldUseNativeCapture({
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
        maxTouchPoints: 5,
        coarsePointer: true,
      }),
    ).toBe(true);
  });

  it("uses the native camera on iPhone", () => {
    expect(
      shouldUseNativeCapture({
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        maxTouchPoints: 5,
        coarsePointer: true,
      }),
    ).toBe(true);
  });

  it("uses the native camera on iPad, including desktop-class UA", () => {
    expect(
      shouldUseNativeCapture({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        maxTouchPoints: 5,
        coarsePointer: true,
      }),
    ).toBe(true);
  });

  it("keeps the in-browser recorder on desktop", () => {
    expect(shouldUseNativeCapture(desktop)).toBe(false);
  });

  it("keeps the in-browser recorder on touch laptops", () => {
    expect(
      shouldUseNativeCapture({ ...desktop, maxTouchPoints: 10 }),
    ).toBe(false);
  });

  it("falls back to coarse-pointer touch devices", () => {
    expect(
      shouldUseNativeCapture({
        userAgent: "",
        maxTouchPoints: 5,
        coarsePointer: true,
      }),
    ).toBe(true);
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

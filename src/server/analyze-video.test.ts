import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeVideo } from "./analyze-video";

describe("analyzeVideo", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns null without a key and never calls fetch", async () => {
    vi.stubEnv("META_MODEL_API_KEY", "");
    const spy = vi.spyOn(globalThis, "fetch");
    await expect(
      analyzeVideo(Buffer.from("clip"), "video/mp4"),
    ).resolves.toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns null for oversize video without calling fetch", async () => {
    vi.stubEnv("META_MODEL_API_KEY", "LLM_test");
    const spy = vi.spyOn(globalThis, "fetch");
    await expect(
      analyzeVideo(Buffer.alloc(26 * 1024 * 1024), "video/mp4"),
    ).resolves.toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});

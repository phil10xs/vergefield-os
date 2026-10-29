import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeVideo, assessIssue } from "./analyze-video";

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

  function mockAnalysis(outputText: string) {
    vi.stubEnv("META_MODEL_API_KEY", "LLM_test");
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "file-1" }), { status: 200 }),
    );
    spy.mockResolvedValueOnce(
      new Response(JSON.stringify({ output_text: outputText }), {
        status: 200,
      }),
    );
    return spy;
  }

  it("returns the trade Meta picks, normalized", async () => {
    mockAnalysis(
      JSON.stringify({
        transcript: "blinds leave a gap",
        description: "Vertical blinds over a large window.",
        trade: "joiner",
      }),
    );
    await expect(
      analyzeVideo(Buffer.from("clip"), "video/mp4"),
    ).resolves.toEqual({
      transcript: "blinds leave a gap",
      description: "Vertical blinds over a large window.",
      trade: "Joiner",
    });
  });

  it("nulls an unknown trade but keeps transcript and description", async () => {
    mockAnalysis(
      JSON.stringify({
        transcript: "hello",
        description: "A room.",
        trade: "Astronaut",
      }),
    );
    await expect(
      analyzeVideo(Buffer.from("clip"), "video/mp4"),
    ).resolves.toEqual({
      transcript: "hello",
      description: "A room.",
      trade: null,
    });
  });

  it("nulls the trade for non-JSON replies", async () => {
    mockAnalysis("just some words");
    await expect(
      analyzeVideo(Buffer.from("clip"), "video/mp4"),
    ).resolves.toEqual({
      transcript: "",
      description: "just some words",
      trade: null,
    });
  });
});

describe("assessIssue", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function mockTriage(outputText: string) {
    vi.stubEnv("META_MODEL_API_KEY", "LLM_test");
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockResolvedValueOnce(
      new Response(JSON.stringify({ output_text: outputText }), {
        status: 200,
      }),
    );
    return spy;
  }

  it("parses severity and cost band", async () => {
    mockTriage(JSON.stringify({ severity: "HIGH", cost_band: "£40–£120" }));
    await expect(assessIssue("tap leaks", "dripping tap")).resolves.toEqual({
      severity: "high",
      costBand: "£40–£120",
    });
  });

  it("nulls a missing cost band", async () => {
    mockTriage(JSON.stringify({ severity: "low", cost_band: null }));
    await expect(assessIssue("a", "b")).resolves.toEqual({
      severity: "low",
      costBand: null,
    });
  });

  it("rejects an unknown severity", async () => {
    mockTriage(JSON.stringify({ severity: "urgent", cost_band: "£10" }));
    await expect(assessIssue("a", "b")).resolves.toBeNull();
  });

  it("returns null without evidence or key", async () => {
    vi.stubEnv("META_MODEL_API_KEY", "LLM_test");
    const spy = vi.spyOn(globalThis, "fetch");
    await expect(assessIssue("  ", "")).resolves.toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});

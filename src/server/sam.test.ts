import { describe, expect, it } from "vitest";
import {
  conceptFromAnalysis,
  fitBoxToContain,
  parseSamRegions,
} from "./sam";

const BOX =
  "<0f>0<|box;x1=1445;y1=442;x2=1884;y2=621;w=1920;h=1280|><|mask;x=0;y=0;data=AAAA|>1<|endoftext|>";

describe("parseSamRegions", () => {
  it("converts a box tag to fractions", () => {
    const [region] = parseSamRegions(BOX, "mould");
    expect(region?.label).toBe("mould");
    expect(region?.x).toBeCloseTo(1445 / 1920, 4);
    expect(region?.y).toBeCloseTo(442 / 1280, 4);
    expect(region?.w).toBeCloseTo(439 / 1920, 4);
    expect(region?.h).toBeCloseTo(179 / 1280, 4);
  });

  it("collects several boxes and skips junk", () => {
    const text = `here <|box;x1=0;y1=0;x2=100;y2=100;w=1000;h=1000|> junk <|box;x1=10;y1=20;x2=110;y2=220;w=1000;h=1000|> end`;
    const regions = parseSamRegions(text, "leak");
    expect(regions).toHaveLength(2);
    expect(regions[1]).toMatchObject({ x: 0.01, y: 0.02, w: 0.1, h: 0.2 });
  });

  it("returns [] for empty or box-less text", () => {
    expect(parseSamRegions("", "x")).toEqual([]);
    expect(parseSamRegions("no boxes here", "x")).toEqual([]);
  });

  it("drops malformed and degenerate boxes", () => {
    const text = [
      "<|box;x1=0;y1=0;x2=10;y2=10;w=0;h=100|>", // zero canvas
      "<|box;x1=50;y1=50;x2=40;y2=60;w=100;h=100|>", // inverted
      "<|box;x1=a;y1=0;x2=10;y2=10;w=100;h=100|>", // non-numeric
    ].join(" ");
    expect(parseSamRegions(text, "x")).toEqual([]);
  });

  it("caps at three regions", () => {
    const one = "<|box;x1=0;y1=0;x2=10;y2=10;w=100;h=100|>";
    expect(parseSamRegions(one.repeat(5), "x")).toHaveLength(3);
  });

  it("keeps the frame canvas on each region", () => {
    const [region] = parseSamRegions(BOX, "mould");
    expect(region).toMatchObject({ fw: 1920, fh: 1280 });
  });
});

describe("fitBoxToContain", () => {
  it("pillarboxes portrait frames", () => {
    const box = fitBoxToContain({
      label: "x",
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      fw: 900,
      fh: 1600,
    });
    expect(box.left).toBeCloseTo((1 - 0.5625 / (16 / 9)) / 2, 4);
    expect(box.width).toBeCloseTo(0.5625 / (16 / 9), 4);
    expect(box.top).toBe(0);
    expect(box.height).toBe(1);
  });

  it("is identity at 16:9", () => {
    const box = fitBoxToContain({
      label: "x",
      x: 0.1,
      y: 0.2,
      w: 0.3,
      h: 0.4,
      fw: 1600,
      fh: 900,
    });
    expect(box).toMatchObject({ left: 0.1, top: 0.2, width: 0.3, height: 0.4 });
  });
});

describe("conceptFromAnalysis", () => {
  it("prefers the model-named object", () => {
    expect(
      conceptFromAnalysis({
        object: "drawer",
        description: "A kitchen.",
        transcript: "",
      }),
    ).toBe("drawer");
  });

  it("falls back to known nouns in the evidence", () => {
    expect(
      conceptFromAnalysis({
        object: null,
        description: "The footage shows a white wardrobe.",
        transcript: "my cupboard fell off",
      }),
    ).toBe("cupboard");
  });

  it("returns null when nothing matches", () => {
    expect(
      conceptFromAnalysis({ object: null, description: "A room.", transcript: "" }),
    ).toBeNull();
  });
});

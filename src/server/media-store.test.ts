import { join } from "path";
import { describe, expect, it } from "vitest";
import { mediaKind, safeFilename, uploadPath } from "./media-store";

describe("mediaKind", () => {
  it("classifies photos, videos, and rejects the rest", () => {
    expect(mediaKind("image/png")).toBe("photo");
    expect(mediaKind("video/mp4")).toBe("video");
    expect(mediaKind("application/pdf")).toBeNull();
    expect(mediaKind("")).toBeNull();
  });
});

describe("safeFilename", () => {
  it("strips paths and unsafe characters", () => {
    expect(safeFilename("../../etc/passwd")).toBe("passwd");
    expect(safeFilename("my photo(1).PNG")).toBe("my_photo_1_.PNG");
    expect(safeFilename("")).toBe("capture");
  });
});

describe("uploadPath", () => {
  it("resolves inside the uploads root", () => {
    expect(uploadPath("job-1", "a.png")).toBe(
      join(process.cwd(), "uploads", "job-1", "a.png"),
    );
  });

  it("rejects traversal", () => {
    expect(() => uploadPath("..", "x")).toThrow("Invalid path");
  });
});

import { describe, expect, it } from "vitest";
import { adjacentBoardStatus } from "./board-flow";

describe("adjacentBoardStatus", () => {
  it("steps one column at a time", () => {
    expect(adjacentBoardStatus("requested", "next")).toBe("in_progress");
    expect(adjacentBoardStatus("in_progress", "next")).toBe("completed");
    expect(adjacentBoardStatus("completed", "prev")).toBe("in_progress");
    expect(adjacentBoardStatus("paid", "prev")).toBe("completed");
  });

  it("stops at the ends", () => {
    expect(adjacentBoardStatus("requested", "prev")).toBeNull();
    expect(adjacentBoardStatus("paid", "next")).toBeNull();
  });
});

/** Property-board columns, left to right. One arrow click moves one step. */
export const BOARD_FLOW = [
  "requested",
  "in_progress",
  "completed",
  "paid",
] as const;

export type BoardFlowStatus = (typeof BOARD_FLOW)[number];

/** Next or previous column. Null at the ends, and when moving back from outside the flow. */
export function adjacentBoardStatus(
  current: string,
  direction: "next" | "prev",
): BoardFlowStatus | null {
  const at = (BOARD_FLOW as readonly string[]).indexOf(current);
  if (at === -1) {
    return direction === "next" ? "requested" : null;
  }
  const next = at + (direction === "next" ? 1 : -1);
  if (next < 0 || next >= BOARD_FLOW.length) return null;
  return BOARD_FLOW[next]!;
}

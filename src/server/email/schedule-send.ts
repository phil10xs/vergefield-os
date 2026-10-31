import { after } from "next/server";

/**
 * Run a send after the response is finished so the board can open first.
 * If `after` is unavailable, start the task without awaiting it.
 */
export function queueBoardLinkSend(task: () => Promise<unknown>) {
  const run = () =>
    Promise.resolve()
      .then(task)
      .catch((error) => {
        console.error(
          "[board-link] SES send failed",
          error instanceof Error ? error.name : "Error",
        );
      });
  try {
    after(run);
  } catch {
    void run();
  }
}

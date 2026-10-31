export const BOARD_EMAIL_STATUSES = [
  "scheduled",
  "skipped_not_configured",
  "failed",
  "not_emailed",
  "already_sent",
] as const;

export type BoardEmailStatus = (typeof BOARD_EMAIL_STATUSES)[number];

export type BoardOpenResult = {
  boardPath: string;
  propertiesUrl: string;
  email: string;
  emailStatus: BoardEmailStatus;
  message: string;
};

export type ViewBoardOutcome = BoardOpenResult & {
  navigated: boolean;
  navError: string | null;
  href: string;
};

/**
 * Schedule the landlord email first, then navigate.
 * Email success is not required for navigation, and a navigation throw does
 * not cancel the open() call that already queued the send.
 */
export async function runViewBoardClick(input: {
  open: () => Promise<BoardOpenResult>;
  navigate: (path: string) => void | Promise<void>;
}): Promise<ViewBoardOutcome> {
  const opened = await input.open();
  const href = withEmailStatus(opened.boardPath, opened.emailStatus);
  try {
    await Promise.resolve(input.navigate(href));
    return { ...opened, navigated: true, navError: null, href };
  } catch {
    return {
      ...opened,
      navigated: false,
      navError:
        opened.emailStatus === "scheduled"
          ? "Couldn't open the board. Your email is still being sent."
          : "Couldn't open the board.",
      href,
    };
  }
}

export function withEmailStatus(
  boardPath: string,
  status: BoardEmailStatus,
): string {
  const url = new URL(boardPath, "https://demo-vergesnag.goverge.app");
  url.searchParams.set("email", status);
  url.searchParams.set("celebrate", "1");
  return `${url.pathname}${url.search}`;
}

/** Helper under View Board. A repeat open must not promise another email. */
export function viewBoardHelperText(
  email: string,
  linkAlreadySent: boolean,
): string {
  if (linkAlreadySent) {
    return `Opens this property's board. This property is on their existing list for ${email}. No password.`;
  }
  return `Emails ${email} and opens this property's board. No password.`;
}

export function snagListDescription(linkAlreadySent: boolean): string {
  if (linkAlreadySent) {
    return "Issues snag list for this property. View Board opens the board. This property is on your existing list.";
  }
  return "Issues snag list for this property. View Board emails your properties link and opens the board.";
}

export const BOARD_MOVE_HINT =
  "You can move issues on this board now with the arrows.";

export function boardEmailNotice(status: string | undefined): string | null {
  switch (status) {
    case "scheduled":
      return `Sending your properties link. ${BOARD_MOVE_HINT}`;
    case "skipped_not_configured":
      return `Email is not configured (SES_FROM_EMAIL), so nothing was sent. ${BOARD_MOVE_HINT}`;
    case "failed":
      return `The email could not be started. ${BOARD_MOVE_HINT}`;
    case "not_emailed":
      return `No email was sent. ${BOARD_MOVE_HINT}`;
    case "already_sent":
      return `This property is on your existing list. ${BOARD_MOVE_HINT}`;
    default:
      return null;
  }
}

/** Arrival is View Board's celebrate=1. Paid is a move into that column only. */
export function boardConfettiKind(
  celebrate: string | undefined,
  email: string | undefined,
): "arrival" | "paid" | null {
  if (celebrate === "paid") return "paid";
  if (celebrate === "1" && boardEmailNotice(email)) return "arrival";
  return null;
}

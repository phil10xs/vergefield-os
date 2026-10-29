// Demo seam: no email provider is wired, so links are surfaced in-app and
// this call only logs. Production swaps this body for a transactional-email
// send and returns true.
export async function sendBoardLinkEmail(
  email: string,
  url: string,
): Promise<boolean> {
  console.log(`[board-link] demo mode — link for ${email}: ${url}`);
  return false;
}

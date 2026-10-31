import { boardLinkEmailContent } from "@/server/email/board-link";
import {
  clientEmailErrorMessage,
  emailConfigured,
  sendEmail,
} from "@/server/email/ses";

export type BoardLinkEmailResult = {
  status: "sent" | "skipped_not_configured" | "failed";
  message: string;
};

/** Send the landlord link. Never reports success unless SES accepts it. */
export async function sendBoardLinkEmail(
  email: string,
  propertiesUrl: string,
  recipientName?: string | null,
): Promise<BoardLinkEmailResult> {
  if (!emailConfigured()) {
    console.warn("[board-link] SES_FROM_EMAIL unset — email not sent");
    return {
      status: "skipped_not_configured",
      message:
        "Email is not configured (SES_FROM_EMAIL). Nothing was sent.",
    };
  }
  const content = boardLinkEmailContent({ propertiesUrl, recipientName });
  try {
    await sendEmail({
      to: email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      fromName: "VergeCare",
    });
    return {
      status: "sent",
      message: `Link emailed to ${email}. It expires in 7 days.`,
    };
  } catch (error) {
    console.error(
      "[board-link] SES send failed",
      error instanceof Error ? error.name : "Error",
    );
    return { status: "failed", message: clientEmailErrorMessage(error) };
  }
}

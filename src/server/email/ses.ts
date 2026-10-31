import {
  GetSuppressedDestinationCommand,
  SESv2Client,
  SendEmailCommand,
} from "@aws-sdk/client-sesv2";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  fromName?: string;
};

const RESERVED_DOMAIN_SUFFIXES = [
  ".example",
  ".invalid",
  ".test",
  ".localhost",
] as const;

const DISPOSABLE_DOMAINS = new Set([
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "cool.fr.nf",
  "jetable.org",
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "sharklasers.com",
  "trashmail.com",
  "tempmail.com",
  "10minutemail.com",
]);

function getClient() {
  const region = process.env.AWS_REGION || "us-east-1";
  return new SESv2Client({ region });
}

function formatFromDisplayName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "";
  const escaped = trimmed.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  if (/[<>()[\]\\,;:@"]/.test(trimmed) || /^\s|\s$/.test(trimmed)) {
    return `"${escaped}"`;
  }
  return escaped;
}

function fromAddress(fromName?: string) {
  const email = process.env.SES_FROM_EMAIL?.trim();
  if (!email) throw new Error("SES_FROM_EMAIL is not configured");
  const name = fromName?.trim() || process.env.SES_FROM_NAME?.trim() || "VergeCare";
  return `${formatFromDisplayName(name)} <${email}>`;
}

export function emailConfigured() {
  return Boolean(process.env.SES_FROM_EMAIL?.trim());
}

function domainOf(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

/** True when SES must not send (reserved or disposable inbox). */
export function isBlockedEmailRecipient(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) return true;
  const domain = domainOf(trimmed);
  if (!domain) return true;
  if (
    RESERVED_DOMAIN_SUFFIXES.some(
      (suffix) => domain === suffix.slice(1) || domain.endsWith(suffix),
    )
  ) {
    return true;
  }
  return DISPOSABLE_DOMAINS.has(domain);
}

function isNotFoundException(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return "name" in error && error.name === "NotFoundException";
}

/** Fail open on lookup errors so a missing IAM permission does not block a real send. */
async function isSuppressed(email: string): Promise<boolean> {
  try {
    await getClient().send(
      new GetSuppressedDestinationCommand({ EmailAddress: email }),
    );
    return true;
  } catch (error) {
    if (isNotFoundException(error)) return false;
    console.warn("[email] suppression lookup failed");
    return false;
  }
}

export function clientEmailErrorMessage(error: unknown): string {
  const providerError =
    error && typeof error === "object"
      ? (error as { name?: unknown; message?: unknown })
      : null;
  const raw =
    [providerError?.name, providerError?.message]
      .filter((part): part is string => typeof part === "string" && part.length > 0)
      .join(" ") || String(error ?? "");
  const lower = raw.toLowerCase();
  if (
    lower.includes("accountsuspendedexception") ||
    lower.includes("account suspended") ||
    (lower.includes("ses account") && lower.includes("shutdown"))
  ) {
    return "Email sending is unavailable because the SES account is suspended. The board is still open.";
  }
  if (
    lower.includes("accountsendingpausedexception") ||
    lower.includes("sendingpausedexception") ||
    lower.includes("sending paused") ||
    lower.includes("account is paused") ||
    lower.includes("email sending has been disabled")
  ) {
    return "Email sending is temporarily unavailable. The board is still open.";
  }
  if (
    lower.includes("recipient address is not allowed") ||
    lower.includes("blocked recipient") ||
    lower.includes("message rejected") ||
    lower.includes("not verified")
  ) {
    return "That email could not be delivered. Check the address and try again. The board is still open.";
  }
  if (lower.includes("throttl") || lower.includes("rate exceeded")) {
    return "Email is temporarily rate-limited. The board is still open.";
  }
  if (lower.includes("ses_from_email is not configured")) {
    return "Email is not configured (SES_FROM_EMAIL). Nothing was sent.";
  }
  return "Email could not be sent right now. The board is still open.";
}

/**
 * Send one transactional message. Throws if SES is not configured or the
 * provider rejects the message — callers must not treat a throw as success.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!emailConfigured()) {
    throw new Error("SES_FROM_EMAIL is not configured");
  }
  const to = input.to.trim();
  if (!to) throw new Error("sendEmail requires a recipient");
  if (isBlockedEmailRecipient(to)) {
    throw new Error(
      "Message rejected: recipient address is not allowed (reserved or disposable domain)",
    );
  }
  if (await isSuppressed(to)) {
    throw new Error(
      "Message rejected: recipient address is not allowed (suppressed: bounce or complaint)",
    );
  }

  const configurationSetName = process.env.SES_CONFIGURATION_SET?.trim();
  await getClient().send(
    new SendEmailCommand({
      FromEmailAddress: fromAddress(input.fromName),
      Destination: { ToAddresses: [to] },
      ...(configurationSetName
        ? { ConfigurationSetName: configurationSetName }
        : {}),
      Content: {
        Simple: {
          Subject: { Data: input.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: input.html, Charset: "UTF-8" },
            Text: { Data: input.text, Charset: "UTF-8" },
          },
        },
      },
    }),
  );
}

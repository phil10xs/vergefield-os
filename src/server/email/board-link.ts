import {
  emailBrandFooter,
  emailCtaButton,
  escapeHtml,
  renderEmailLayout,
} from "@/server/email/templates";

/** Landlord magic-link email. One link opens every checked-in property. */
export function boardLinkEmailContent(input: {
  propertiesUrl: string;
  recipientName?: string | null;
}) {
  const who = input.recipientName?.trim();
  const hello = who ? `Hello ${who},` : "Hello,";
  const subject = "Your VergeCare link";
  const text = [
    hello,
    "",
    "Here is your private VergeCare link. It opens every property you have checked in.",
    "",
    `Open my properties: ${input.propertiesUrl}`,
    "",
    "No password needed. This link is your access.",
    "It expires in 7 days. Do not forward it to anyone who should not see your properties, issues, or bills.",
    "",
    emailBrandFooter(),
  ].join("\n");

  const bodyHtml = `
      <p style="margin:0 0 16px;">${escapeHtml(hello)}</p>
      <p style="margin:0 0 16px;">
        Here is your private <strong>VergeCare</strong> link. It opens every
        property you have checked in.
      </p>
      <p style="margin:0 0 20px;">
        ${emailCtaButton(input.propertiesUrl, "Open my properties")}
      </p>
      <p style="margin:0 0 16px;font-size:13px;color:#555;">
        Or open this link:<br />
        ${escapeHtml(input.propertiesUrl)}
      </p>
      <p style="margin:0;font-size:13px;color:#555;">
        No password needed. This link is your access. It expires in 7 days.
        Do not forward it to anyone who should not see your properties, issues,
        or bills.
      </p>
  `.trim();

  return {
    subject,
    html: renderEmailLayout({ bodyHtml, preheader: subject }),
    text,
  };
}

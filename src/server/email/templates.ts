import { brand, colors } from "@/brand";
import { appUrl } from "@/lib/app-url";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

/** Shared CTA. Same structure as the GoVerge transactional button. */
export function emailCtaButton(href: string, label: string) {
  return `<a href="${escapeAttr(href)}"
           style="display:inline-block;background:${colors.teal};color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600;font-family:Helvetica,Arial,sans-serif;">
          ${escapeHtml(label)}
        </a>`;
}

export function emailBrandFooter(): string {
  return [
    `${brand.shortName}: ${brand.tagline}`,
    brand.description,
  ].join("\n");
}

function emailHeaderHtml() {
  const logoUrl = `${appUrl()}/brand/vergecare-96.png`;
  return `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:12px;">
                      <img src="${escapeAttr(logoUrl)}" width="40" height="40" alt=""
                        style="display:block;border-radius:10px;" />
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="font-size:20px;line-height:1.2;font-weight:700;color:${colors.ink};letter-spacing:-0.02em;">
                        ${escapeHtml(brand.shortName)}
                      </div>
                    </td>
                  </tr>
                </table>`;
}

function emailHtmlFooter() {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-top:1px solid #e5e7eb;">
      <tr>
        <td style="padding:24px 0 0;font-family:Helvetica,Arial,sans-serif;">
          <div style="font-size:22px;line-height:1.2;font-weight:700;color:${colors.ink};letter-spacing:-0.02em;">
            ${escapeHtml(brand.shortName)}
          </div>
          <p style="margin:14px 0 0;font-size:14px;line-height:1.55;color:#555555;max-width:520px;">
            ${escapeHtml(brand.tagline)} ${escapeHtml(brand.description)}
          </p>
        </td>
      </tr>
    </table>
  `.trim();
}

/** VergeCare shell: header, body, footer. Same card structure as GoVerge mail. */
export function renderEmailLayout(input: {
  bodyHtml: string;
  preheader?: string;
}) {
  const preheader = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
        ${escapeHtml(input.preheader)}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(brand.shortName)}</title>
  </head>
  <body style="margin:0;padding:0;background:${colors.cloud};">
    ${preheader}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${colors.cloud};">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;">
            <tr>
              <td style="padding:28px 28px 8px;font-family:Helvetica,Arial,sans-serif;">
                ${emailHeaderHtml()}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0f172a;">
                ${input.bodyHtml}
                ${emailHtmlFooter()}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

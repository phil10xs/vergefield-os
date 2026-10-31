/** Public origin for magic links. Runtime APP_URL wins so the host can change without a rebuild. */
export const PUBLIC_ORIGIN = "https://demo-vergecare.goverge.app";

export function appUrl(): string {
  const configured = [process.env.APP_URL, process.env.NEXT_PUBLIC_APP_URL]
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value));
  return (configured ?? PUBLIC_ORIGIN).replace(/\/$/, "");
}

export function landlordPath(token: string): string {
  return `/b/${encodeURIComponent(token)}`;
}

export function landlordPropertiesUrl(token: string): string {
  return `${appUrl()}${landlordPath(token)}`;
}

export function propertySnagPath(token: string, address: string): string {
  return `${landlordPath(token)}/p/${propertySegment(address)}`;
}

export function propertyBoardPath(token: string, address: string): string {
  return `${propertySnagPath(token, address)}/board`;
}

function propertySegment(address: string): string {
  return encodeURIComponent(addressKey(address));
}

export function addressKey(address: string): string {
  return Buffer.from(address, "utf8").toString("base64url");
}

export function addressFromKey(key: string): string | null {
  if (!key || !/^[A-Za-z0-9_-]+$/.test(key)) return null;
  let address = "";
  try {
    address = Buffer.from(key, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!address || address.includes("\0")) return null;
  if (addressKey(address) !== key) return null;
  return address;
}

/** Keep redirects on this app's track and magic-link routes. */
export function safeAppPath(value: string | null): string | null {
  if (!value || /[\n\r\\]/.test(value)) return null;
  let url: URL;
  try {
    url = new URL(value, PUBLIC_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PUBLIC_ORIGIN) return null;
  if (url.pathname !== "/track" && !url.pathname.startsWith("/b/")) return null;
  return `${url.pathname}${url.search}`;
}

export function withSearchParam(
  path: string,
  key: string,
  value: string,
): string {
  const url = new URL(path, PUBLIC_ORIGIN);
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

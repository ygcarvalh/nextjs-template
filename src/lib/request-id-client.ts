import { REQUEST_ID_HEADER, sanitizeRequestId } from "@/lib/request-id";

export function readRequestIdCookie(cookie: string): string | null {
  const match = cookie.split("; ").find((entry) => entry.startsWith(`${REQUEST_ID_HEADER}=`));
  if (!match) {
    return null;
  }
  return sanitizeRequestId(decodeURIComponent(match.slice(REQUEST_ID_HEADER.length + 1)));
}

export function currentRequestId(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  return readRequestIdCookie(document.cookie);
}

// A `?next=` parameter echoed into a redirect is the classic open redirect.
// Only same-origin absolute paths survive this filter.

// Control characters, CR/LF included, can smuggle a second header or slip past
// a naive prefix check.
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching them is the point
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

export function safeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  if (CONTROL_CHARACTERS.test(value)) {
    return fallback;
  }

  // "//evil.example" and "/\evil.example" are protocol-relative URLs: they
  // start with "/" but still leave the origin.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }

  return value;
}

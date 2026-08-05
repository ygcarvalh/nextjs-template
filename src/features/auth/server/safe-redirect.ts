// biome-ignore lint/suspicious/noControlCharactersInRegex: matching them is the point
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

export function safeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  if (CONTROL_CHARACTERS.test(value)) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }

  return value;
}

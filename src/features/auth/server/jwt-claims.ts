const DEFAULT_LIFETIME_MS = 30 * 60 * 1000;

function fromBase64Url(value: string): string | null {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    return atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  } catch {
    return null;
  }
}

// Read, never verify: the API owns verification, and this only needs to know
// when to ask for a fresh pair.
export function readExpiry(token: string): number | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }
  const decoded = fromBase64Url(payload);
  if (decoded === null) {
    return null;
  }
  try {
    const claims = JSON.parse(decoded) as { exp?: unknown };
    return typeof claims.exp === "number" ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function lifetimeSeconds(token: string, now: number = Date.now()): number {
  const expiry = readExpiry(token);
  const remaining = expiry === null ? DEFAULT_LIFETIME_MS : expiry - now;
  return Math.max(1, Math.floor(remaining / 1000));
}

export function expiresWithin(token: string, skewMs: number, now: number = Date.now()): boolean {
  const expiry = readExpiry(token);
  return expiry === null || expiry - now <= skewMs;
}

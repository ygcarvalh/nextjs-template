import { afterEach, describe, expect, it, vi } from "vitest";

async function loadCookieConfig(appUrl: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", appUrl);
  return import("@/features/auth/server/session-cookie");
}

describe("session cookie", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("hardens the cookie on an https origin", async () => {
    const { SESSION_COOKIE_NAME, sessionCookieOptions } =
      await loadCookieConfig("https://example.com");

    expect(SESSION_COOKIE_NAME).toBe("__Host-session");
    expect(sessionCookieOptions.secure).toBe(true);
  });

  it("drops the __Host- prefix on a plain http origin", async () => {
    const { SESSION_COOKIE_NAME, sessionCookieOptions } =
      await loadCookieConfig("http://localhost:3000");

    expect(SESSION_COOKIE_NAME).toBe("session");
    expect(sessionCookieOptions.secure).toBe(false);
  });

  it("always sets the flags that do not depend on the scheme", async () => {
    const { sessionCookieOptions } = await loadCookieConfig("http://localhost:3000");

    expect(sessionCookieOptions).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  });

  it("expires the cookie with the session", async () => {
    const { SESSION_TTL_MS, sessionCookieOptions } = await loadCookieConfig("https://example.com");

    expect(sessionCookieOptions.maxAge).toBe(SESSION_TTL_MS / 1000);
  });
});

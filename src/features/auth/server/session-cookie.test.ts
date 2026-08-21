import { afterEach, describe, expect, it, vi } from "vitest";

async function load(appUrl: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", appUrl);
  return import("@/features/auth/server/session-cookie");
}

describe("token cookie names", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefixes both names on an https origin", async () => {
    const { ACCESS_COOKIE, REFRESH_COOKIE } = await load("https://app.example.com");

    expect([ACCESS_COOKIE, REFRESH_COOKIE]).toEqual(["__Host-access", "__Host-refresh"]);
  });

  it("drops the prefix on http, where the browser would refuse it", async () => {
    const { ACCESS_COOKIE, REFRESH_COOKIE } = await load("http://localhost:3000");

    expect([ACCESS_COOKIE, REFRESH_COOKIE]).toEqual(["access", "refresh"]);
  });

  it("follows the scheme for the secure flag", async () => {
    const secure = await load("https://app.example.com");
    const insecure = await load("http://localhost:3000");

    expect(secure.tokenCookieOptions(60).secure).toBe(true);
    expect(insecure.tokenCookieOptions(60).secure).toBe(false);
  });

  it("keeps the flags a session cookie needs", async () => {
    const { tokenCookieOptions } = await load("http://localhost:3000");

    expect(tokenCookieOptions(120)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 120,
    });
  });
});

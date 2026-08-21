import { describe, expect, it, vi } from "vitest";
import { cookieJar, mockNextHeaders } from "../../../../test/next-headers";

function token(expSeconds: number): string {
  const payload = btoa(JSON.stringify({ exp: expSeconds }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `header.${payload}.signature`;
}

async function load(initial: Record<string, string> = {}) {
  vi.resetModules();
  const jar = cookieJar(initial);
  mockNextHeaders(jar);
  const tokens = await import("@/features/auth/server/tokens");
  return { jar, tokens };
}

describe("token cookies", () => {
  it("reads both cookies", async () => {
    const { tokens } = await load({ access: "a", refresh: "r" });

    await expect(tokens.readTokens()).resolves.toEqual({ access: "a", refresh: "r" });
  });

  it("reports nothing when the jar is empty", async () => {
    const { tokens } = await load();

    await expect(tokens.readTokens()).resolves.toEqual({ access: null, refresh: null });
  });

  it("writes each cookie for as long as its own token lasts", async () => {
    const { jar, tokens } = await load();
    const now = Math.floor(Date.now() / 1000);

    await tokens.writeTokens({
      access_token: token(now + 1800),
      refresh_token: token(now + 604_800),
    });

    const access = jar.options.get("access") as { maxAge: number; httpOnly: boolean };
    const refresh = jar.options.get("refresh") as { maxAge: number };
    expect(access.httpOnly).toBe(true);
    expect(access.maxAge).toBeGreaterThan(1700);
    expect(refresh.maxAge).toBeGreaterThan(600_000);
  });

  it("clears both", async () => {
    const { jar, tokens } = await load({ access: "a", refresh: "r" });

    await tokens.clearTokens();

    expect(jar.entries.size).toBe(0);
  });
});

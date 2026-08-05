import { beforeEach, describe, expect, it, vi } from "vitest";
import { cookieSessionProvider } from "@/features/auth/server/cookie-session";
import { SESSION_COOKIE_NAME } from "@/features/auth/server/session-cookie";
import { signSessionToken, verifySessionToken } from "@/features/auth/server/session-token";

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

// Matches `test.env` in vitest.config.ts.
const SECRET = "test-session-secret-at-least-32-characters";

describe("cookieSessionProvider", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
    cookieStore.delete.mockReset();
  });

  it("reads no session when the cookie is absent", async () => {
    cookieStore.get.mockReturnValue(undefined);

    await expect(cookieSessionProvider.read()).resolves.toBeNull();
  });

  it("reads a session from a valid token", async () => {
    const session = { userId: "alice", email: "alice@example.com", expiresAt: Date.now() + 60_000 };
    cookieStore.get.mockReturnValue({ value: await signSessionToken(session, SECRET) });

    await expect(cookieSessionProvider.read()).resolves.toEqual(session);
    expect(cookieStore.get).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
  });

  it("reads no session from a tampered token", async () => {
    const session = { userId: "alice", email: "alice@example.com", expiresAt: Date.now() + 60_000 };
    const token = await signSessionToken(session, SECRET);
    cookieStore.get.mockReturnValue({ value: `${token}tampered` });

    await expect(cookieSessionProvider.read()).resolves.toBeNull();
  });

  it("writes a cookie that is httpOnly and not readable by script", async () => {
    await cookieSessionProvider.create({ userId: "alice", email: "alice@example.com" });

    const [name, , options] = cookieStore.set.mock.calls[0];
    expect(name).toBe(SESSION_COOKIE_NAME);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("writes a token that verifies back to the identity", async () => {
    await cookieSessionProvider.create({ userId: "alice", email: "alice@example.com" });

    const [, token] = cookieStore.set.mock.calls[0];
    const session = await verifySessionToken(token, SECRET);

    expect(session).toMatchObject({ userId: "alice", email: "alice@example.com" });
    expect(session?.expiresAt).toBeGreaterThan(Date.now());
  });

  it("does not accept the written token under a different secret", async () => {
    await cookieSessionProvider.create({ userId: "alice", email: "alice@example.com" });

    const [, token] = cookieStore.set.mock.calls[0];

    await expect(
      verifySessionToken(token, "a-completely-different-secret-32ch"),
    ).resolves.toBeNull();
  });

  it("clears the cookie on destroy", async () => {
    await cookieSessionProvider.destroy();

    expect(cookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const provider = {
  read: vi.fn(),
  create: vi.fn(),
  destroy: vi.fn(),
};

vi.mock("@/features/auth/server/cookie-session", () => ({ cookieSessionProvider: provider }));

// Guards the composition point: the exported helpers must delegate to whichever
// provider is bound, so swapping the adapter cannot silently bypass them.
describe("session composition", () => {
  beforeEach(() => {
    provider.read.mockReset();
    provider.create.mockReset();
    provider.destroy.mockReset();
  });

  it("reads through the bound provider", async () => {
    const session = { userId: "alice", email: "alice@example.com", expiresAt: 1 };
    provider.read.mockResolvedValue(session);
    const { getSession } = await import("@/features/auth/server/session");

    await expect(getSession()).resolves.toBe(session);
  });

  it("creates through the bound provider", async () => {
    const { createSession } = await import("@/features/auth/server/session");
    const identity = { userId: "alice", email: "alice@example.com" };

    await createSession(identity);

    expect(provider.create).toHaveBeenCalledWith(identity);
  });

  it("destroys through the bound provider", async () => {
    const { destroySession } = await import("@/features/auth/server/session");

    await destroySession();

    expect(provider.destroy).toHaveBeenCalledTimes(1);
  });
});

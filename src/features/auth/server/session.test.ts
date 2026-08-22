import { beforeEach, describe, expect, it, vi } from "vitest";

const provider = vi.hoisted(() => ({
  read: vi.fn(),
  create: vi.fn(),
  register: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock("@/features/auth/server/api-session", () => ({ apiSessionProvider: provider }));

describe("session composition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads through the bound provider", async () => {
    const session = {
      userId: "7",
      email: "ada@example.com",
      name: null,
      role: "user" as const,
    };
    provider.read.mockResolvedValue(session);
    const { getSession } = await import("@/features/auth/server/session");

    await expect(getSession()).resolves.toBe(session);
  });

  it("creates through the bound provider", async () => {
    const { createSession } = await import("@/features/auth/server/session");
    const credentials = { email: "ada@example.com", password: "secret" };

    await createSession(credentials);

    expect(provider.create).toHaveBeenCalledWith(credentials);
  });

  it("registers through the bound provider", async () => {
    const { registerAccount } = await import("@/features/auth/server/session");
    const registration = { email: "ada@example.com", password: "secret", name: "Ada" };

    await registerAccount(registration);

    expect(provider.register).toHaveBeenCalledWith(registration);
  });

  it("destroys through the bound provider", async () => {
    const { destroySession } = await import("@/features/auth/server/session");

    await destroySession();

    expect(provider.destroy).toHaveBeenCalledTimes(1);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { enUS } from "@/i18n/dictionaries/en-US";

const { redirect, createSession, registerAccount, destroySession, adoptStoredPreferences } =
  vi.hoisted(() => ({
    redirect: vi.fn(),
    createSession: vi.fn(),
    registerAccount: vi.fn(),
    destroySession: vi.fn(),
    adoptStoredPreferences: vi.fn(),
  }));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/features/auth/server/session", () => ({
  createSession,
  registerAccount,
  destroySession,
}));
vi.mock("@/features/preferences/server/preferences", () => ({ adoptStoredPreferences }));
vi.mock("@/i18n/server", () => ({ getDictionary: () => Promise.resolve(enUS) }));

const { signUp } = await import("@/features/auth/server/auth-actions");

const session = { userId: "7", email: "ada@example.com", name: "Ada", role: "user" as const };

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    data.set(name, value);
  }
  return data;
}

const filled = {
  email: "ada@example.com",
  password: "Marmalade4Toast",
  confirmation: "Marmalade4Toast",
};

describe("signUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerAccount.mockResolvedValue(session);
  });

  it("asks for the missing fields before spending a round trip", async () => {
    await expect(signUp({ error: null }, form({ email: "ada@example.com" }))).resolves.toEqual({
      error: enUS.register.incomplete,
    });
    expect(registerAccount).not.toHaveBeenCalled();
  });

  it("refuses a password the API floor would reject anyway", async () => {
    const data = form({ email: "ada@example.com", password: "Sh0rt!", confirmation: "Sh0rt!" });

    await expect(signUp({ error: null }, data)).resolves.toEqual({
      error: enUS.register.incomplete,
    });
    expect(registerAccount).not.toHaveBeenCalled();
  });

  it("refuses two passwords that differ", async () => {
    const data = form({ ...filled, confirmation: "Marmalade4Toasted" });

    await expect(signUp({ error: null }, data)).resolves.toEqual({
      error: enUS.register.mismatch,
    });
    expect(registerAccount).not.toHaveBeenCalled();
  });

  it("carries a trimmed name along", async () => {
    await signUp({ error: null }, form({ ...filled, name: "  Ada  " }));

    expect(registerAccount).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "Marmalade4Toast",
      name: "Ada",
    });
  });

  it("sends no name at all rather than a blank one", async () => {
    await signUp({ error: null }, form({ ...filled, name: "   " }));

    expect(registerAccount).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "Marmalade4Toast",
      name: undefined,
    });
  });

  it("says so when the address already has an account", async () => {
    registerAccount.mockResolvedValue({ refused: "taken" });

    await expect(signUp({ error: null }, form(filled))).resolves.toEqual({
      error: enUS.register.taken,
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("stays vague about every other refusal", async () => {
    registerAccount.mockResolvedValue({ refused: "unavailable" });

    await expect(signUp({ error: null }, form(filled))).resolves.toEqual({
      error: enUS.register.unavailable,
    });
  });

  it("adopts the preferences the visitor set before they had an account", async () => {
    await signUp({ error: null }, form(filled));

    expect(adoptStoredPreferences).toHaveBeenCalledTimes(1);
  });

  it("lands a new account on the same screen a sign-in would", async () => {
    await signUp({ error: null }, form(filled));

    expect(redirect).toHaveBeenCalledWith("/notes");
  });
});

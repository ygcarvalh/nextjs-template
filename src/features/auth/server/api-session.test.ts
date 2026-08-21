import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-client";

const {
  apiGet,
  readTokens,
  writeTokens,
  clearTokens,
  exchangeCredentials,
  revokeRefresh,
  outboundRequestId,
} = vi.hoisted(() => ({
  apiGet: vi.fn(),
  readTokens: vi.fn<() => Promise<{ access: string | null; refresh: string | null }>>(),
  writeTokens: vi.fn<() => Promise<void>>(),
  clearTokens: vi.fn<() => Promise<void>>(),
  exchangeCredentials: vi.fn(),
  revokeRefresh: vi.fn<() => Promise<void>>(),
  outboundRequestId: vi.fn<() => Promise<string | null>>(),
}));

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return { ApiError: actual.ApiError, apiGet };
});
vi.mock("@/features/auth/server/tokens", () => ({ readTokens, writeTokens, clearTokens }));
vi.mock("@/features/auth/server/token-exchange", () => ({ exchangeCredentials, revokeRefresh }));
vi.mock("@/lib/request-id-server", () => ({ outboundRequestId }));

const { apiSessionProvider } = await import("@/features/auth/server/api-session");

const user = { id: 7, email: "ada@example.com", name: "Ada", role: "admin" };

describe("apiSessionProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    outboundRequestId.mockResolvedValue("abc-123");
    readTokens.mockResolvedValue({ access: "a", refresh: "r" });
    writeTokens.mockResolvedValue();
    clearTokens.mockResolvedValue();
  });

  it("reads nothing when the browser carries no cookies", async () => {
    readTokens.mockResolvedValue({ access: null, refresh: null });

    await expect(apiSessionProvider.read()).resolves.toBeNull();
    expect(apiGet).not.toHaveBeenCalled();
  });

  it("maps the account the API describes", async () => {
    apiGet.mockResolvedValue(user);

    await expect(apiSessionProvider.read()).resolves.toEqual({
      userId: "7",
      email: "ada@example.com",
      name: "Ada",
      role: "admin",
    });
  });

  it("reads nothing when the API refuses", async () => {
    apiGet.mockRejectedValue(new ApiError(401, "expired", null, true));

    await expect(apiSessionProvider.read()).resolves.toBeNull();
  });

  it("reads nothing when the body is not an account", async () => {
    apiGet.mockResolvedValue({ id: "seven" });

    await expect(apiSessionProvider.read()).resolves.toBeNull();
  });

  it("lets anything that is not an API failure through", async () => {
    apiGet.mockRejectedValue(new TypeError("fetch failed"));

    await expect(apiSessionProvider.read()).rejects.toBeInstanceOf(TypeError);
  });

  it("exchanges credentials, stores the pair and reads the account back", async () => {
    exchangeCredentials.mockResolvedValue({ access_token: "a", refresh_token: "r" });
    apiGet.mockResolvedValue(user);

    await expect(
      apiSessionProvider.create({ email: "ada@example.com", password: "secret" }),
    ).resolves.toMatchObject({ email: "ada@example.com" });

    expect(exchangeCredentials).toHaveBeenCalledWith(
      { email: "ada@example.com", password: "secret" },
      "abc-123",
    );
    expect(writeTokens).toHaveBeenCalledTimes(1);
  });

  it("creates nothing when the credentials are refused", async () => {
    exchangeCredentials.mockResolvedValue(null);

    await expect(
      apiSessionProvider.create({ email: "ada@example.com", password: "wrong" }),
    ).resolves.toBeNull();
    expect(writeTokens).not.toHaveBeenCalled();
  });

  it("retires the refresh token before dropping the cookies", async () => {
    revokeRefresh.mockResolvedValue();

    await apiSessionProvider.destroy();

    expect(revokeRefresh).toHaveBeenCalledWith("r", "abc-123");
    expect(clearTokens).toHaveBeenCalledTimes(1);
  });

  it("still drops the cookies when there was no refresh token", async () => {
    readTokens.mockResolvedValue({ access: "a", refresh: null });

    await apiSessionProvider.destroy();

    expect(revokeRefresh).not.toHaveBeenCalled();
    expect(clearTokens).toHaveBeenCalledTimes(1);
  });
});

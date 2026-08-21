import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exchangeCredentials,
  exchangeRefresh,
  revokeRefresh,
} from "@/features/auth/server/token-exchange";

const pair = { access_token: "a", refresh_token: "r" };

function answer(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("token exchange", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts credentials as a form, the way OAuth2 wants them", async () => {
    vi.mocked(fetch).mockResolvedValue(answer(pair));

    await expect(
      exchangeCredentials({ email: "ada@example.com", password: "secret" }, "abc-123"),
    ).resolves.toEqual(pair);

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/login");
    expect((init.headers as Record<string, string>)["content-type"]).toBe(
      "application/x-www-form-urlencoded",
    );
    expect((init.headers as Record<string, string>)["x-request-id"]).toBe("abc-123");
    expect(String(init.body)).toBe("username=ada%40example.com&password=secret");
  });

  it("omits the correlation header when there is none", async () => {
    vi.mocked(fetch).mockResolvedValue(answer(pair));

    await exchangeCredentials({ email: "ada@example.com", password: "secret" }, null);

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["x-request-id"]).toBeUndefined();
  });

  it("posts a refresh token as JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(answer(pair));

    await expect(exchangeRefresh("r", "abc-123")).resolves.toEqual(pair);

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/refresh");
    expect(String(init.body)).toBe('{"refresh_token":"r"}');
  });

  it.each([
    ["a refused login", answer({ detail: "no" }, 401)],
    ["a body that is not a pair", answer({ access_token: "a" })],
  ])("returns null for %s", async (_case, response) => {
    vi.mocked(fetch).mockResolvedValue(response);

    await expect(exchangeRefresh("r", null)).resolves.toBeNull();
  });

  it("refuses a token carrying a cookie separator", async () => {
    vi.mocked(fetch).mockResolvedValue(
      answer({ access_token: "good; session=admin", refresh_token: "r" }),
    );

    await expect(exchangeRefresh("r", null)).resolves.toBeNull();
  });

  it("returns null when the answer is not JSON at all", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("<html>502</html>", { status: 200 }));

    await expect(
      exchangeCredentials({ email: "ada@example.com", password: "secret" }, null),
    ).resolves.toBeNull();
  });

  it("asks the API to retire a refresh token", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await revokeRefresh("r", "abc-123");

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/logout");
    expect(String(init.body)).toBe('{"refresh_token":"r"}');
    expect((init.headers as Record<string, string>)["x-request-id"]).toBe("abc-123");
  });

  it("shrugs off an API that refuses the sign-out", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("connection refused"));

    await expect(revokeRefresh("r", null)).resolves.toBeUndefined();
  });

  it("returns null when the API cannot be reached", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("connection refused"));

    await expect(exchangeCredentials({ email: "a@b.co", password: "x" }, null)).resolves.toBeNull();
    await expect(exchangeRefresh("r", null)).resolves.toBeNull();
  });
});

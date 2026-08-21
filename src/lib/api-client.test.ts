import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiGet, apiSend, readMessage, readRequestId } from "@/lib/api-client";

const { readTokens, writeTokens, clearTokens, exchangeRefresh, outboundRequestId } = vi.hoisted(
  () => ({
    readTokens: vi.fn<() => Promise<{ access: string | null; refresh: string | null }>>(),
    writeTokens: vi.fn<() => Promise<void>>(),
    clearTokens: vi.fn<() => Promise<void>>(),
    exchangeRefresh: vi.fn(),
    outboundRequestId: vi.fn<() => Promise<string | null>>(),
  }),
);

vi.mock("@/features/auth/server/tokens", () => ({ readTokens, writeTokens, clearTokens }));
vi.mock("@/features/auth/server/token-exchange", () => ({ exchangeRefresh }));
vi.mock("@/lib/request-id-server", () => ({ outboundRequestId }));

function answer(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function headersOf(call: number): Headers {
  const [, init] = vi.mocked(fetch).mock.calls[call] as [string, RequestInit];
  return new Headers(init.headers);
}

describe("readMessage", () => {
  it.each([
    [{ message: "Email already registered" }, "Email already registered"],
    [{ detail: "Not authenticated" }, "Not authenticated"],
    [{ detail: [{ msg: "too short" }, { msg: "not an email" }] }, "too short; not an email"],
  ])("reads %o", (body, expected) => {
    expect(readMessage(body, "fallback")).toBe(expected);
  });

  it.each([[null], [{}], [{ detail: [] }], [{ detail: [{ loc: ["body"] }] }], ["a string"]])(
    "falls back for %o",
    (body) => {
      expect(readMessage(body, "fallback")).toBe("fallback");
    },
  );
});

describe("readRequestId", () => {
  it("prefers the body", () => {
    expect(readRequestId({ request_id: "from-body" }, new Headers({ "x-request-id": "h" }))).toBe(
      "from-body",
    );
  });

  it("falls back to the header", () => {
    expect(readRequestId({}, new Headers({ "x-request-id": "from-header" }))).toBe("from-header");
  });

  it("returns null when neither carries one", () => {
    expect(readRequestId(null, new Headers())).toBeNull();
  });
});

describe("apiGet", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    readTokens.mockResolvedValue({ access: "access-token", refresh: "refresh-token" });
    writeTokens.mockResolvedValue();
    clearTokens.mockResolvedValue();
    outboundRequestId.mockResolvedValue("abc-123");
    exchangeRefresh.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("attaches the bearer token and the correlation id", async () => {
    vi.mocked(fetch).mockResolvedValue(answer({ ok: true }));

    await apiGet("/users/me");

    expect(headersOf(0).get("authorization")).toBe("Bearer access-token");
    expect(headersOf(0).get("x-request-id")).toBe("abc-123");
  });

  it("omits both when there is nothing to send", async () => {
    readTokens.mockResolvedValue({ access: null, refresh: null });
    outboundRequestId.mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValue(answer({ ok: true }));

    await apiGet("/features");

    expect(headersOf(0).get("authorization")).toBeNull();
    expect(headersOf(0).get("x-request-id")).toBeNull();
  });

  it("throws an ApiError carrying the status and the id", async () => {
    vi.mocked(fetch).mockResolvedValue(
      answer({ message: "Email already registered", request_id: "abc-123" }, 409),
    );
    readTokens.mockResolvedValue({ access: "a", refresh: null });

    const error = await apiGet("/users/me").catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, requestId: "abc-123" });
  });

  it("refreshes once on a 401 and replays the call", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(answer({ detail: "expired" }, 401))
      .mockResolvedValueOnce(answer({ id: 1 }));
    exchangeRefresh.mockResolvedValue({ access_token: "fresh", refresh_token: "new-refresh" });

    await expect(apiGet("/users/me")).resolves.toEqual({ id: 1 });

    expect(exchangeRefresh).toHaveBeenCalledTimes(1);
    expect(writeTokens).toHaveBeenCalledWith({
      access_token: "fresh",
      refresh_token: "new-refresh",
    });
    expect(headersOf(1).get("authorization")).toBe("Bearer fresh");
  });

  it("does not refresh twice", async () => {
    vi.mocked(fetch).mockResolvedValue(answer({ detail: "expired" }, 401));
    exchangeRefresh.mockResolvedValue({ access_token: "fresh", refresh_token: "new-refresh" });

    await expect(apiGet("/users/me")).rejects.toBeInstanceOf(ApiError);

    expect(exchangeRefresh).toHaveBeenCalledTimes(1);
  });

  it("still replays when the cookie write is refused by a render", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(answer({ detail: "expired" }, 401))
      .mockResolvedValueOnce(answer({ id: 1 }));
    exchangeRefresh.mockResolvedValue({ access_token: "fresh", refresh_token: "new-refresh" });
    writeTokens.mockRejectedValue(new Error("cookies can only be modified in an action"));

    await expect(apiGet("/users/me")).resolves.toEqual({ id: 1 });
  });

  it("gives up when the refresh is refused", async () => {
    vi.mocked(fetch).mockResolvedValue(answer({ detail: "expired" }, 401));
    exchangeRefresh.mockResolvedValue(null);

    const error = await apiGet("/users/me").catch((thrown: unknown) => thrown);

    expect(error).toMatchObject({ status: 401, expired: true });
    expect(clearTokens).toHaveBeenCalledTimes(1);
  });

  it("tolerates a jar that refuses to be cleared", async () => {
    vi.mocked(fetch).mockResolvedValue(answer({ detail: "expired" }, 401));
    exchangeRefresh.mockResolvedValue(null);
    clearTokens.mockRejectedValue(new Error("cookies can only be modified in an action"));

    await expect(apiGet("/users/me")).rejects.toMatchObject({ expired: true });
  });

  it("falls back when the failure body is not JSON at all", async () => {
    readTokens.mockResolvedValue({ access: "a", refresh: null });
    vi.mocked(fetch).mockResolvedValue(
      new Response("<html>502 Bad Gateway</html>", { status: 502 }),
    );

    const error = await apiGet("/users/me", "the fallback").catch((thrown: unknown) => thrown);

    expect(error).toMatchObject({ status: 502, message: "the fallback", requestId: null });
  });

  it("does not try to refresh without a refresh token", async () => {
    readTokens.mockResolvedValue({ access: "a", refresh: null });
    vi.mocked(fetch).mockResolvedValue(answer({ detail: "no" }, 401));

    await expect(apiGet("/users/me")).rejects.toBeInstanceOf(ApiError);
    expect(exchangeRefresh).not.toHaveBeenCalled();
  });
});

describe("apiSend", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    readTokens.mockResolvedValue({ access: "a", refresh: null });
    outboundRequestId.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("sends a JSON body", async () => {
    vi.mocked(fetch).mockResolvedValue(answer({ id: 1 }));

    await apiSend("PATCH", "/users/me", { name: "Ada" });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("PATCH");
    expect(String(init.body)).toBe('{"name":"Ada"}');
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
  });

  it("sends no body when there is nothing to send", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiSend("DELETE", "/users/me")).resolves.toBeUndefined();

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(init.body).toBeUndefined();
  });
});

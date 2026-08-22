import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { exchangeRefresh } = vi.hoisted(() => ({ exchangeRefresh: vi.fn() }));

vi.mock("@/features/auth/server/token-exchange", () => ({ exchangeRefresh }));

const { default: proxy } = await import("@/proxy");

function token(expSeconds: number): string {
  const payload = btoa(JSON.stringify({ exp: expSeconds }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `header.${payload}.signature`;
}

const FRESH = token(Math.floor(Date.now() / 1000) + 3600);
const STALE = token(Math.floor(Date.now() / 1000) + 10);

function request(
  path: string,
  {
    cookies = "",
    method = "GET",
    headers = {},
  }: { cookies?: string; method?: string; headers?: Record<string, string> } = {},
) {
  return new NextRequest(new URL(`http://localhost:3000${path}`), {
    method,
    headers: { ...(cookies ? { cookie: cookies } : {}), ...headers },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the correlation id", () => {
  it("keeps a well-formed inbound id", async () => {
    const response = await proxy(request("/", { headers: { "x-request-id": "abc-123" } }));

    expect(response.headers.get("x-request-id")).toBe("abc-123");
    expect(response.cookies.get("x-request-id")?.value).toBe("abc-123");
  });

  it("replaces a forged one", async () => {
    const response = await proxy(request("/", { headers: { "x-request-id": "a b c" } }));

    expect(response.headers.get("x-request-id")).toHaveLength(32);
  });

  it("stays out of the log for a probe", async () => {
    await proxy(request("/api/health"));

    expect(console.log).not.toHaveBeenCalled();
  });

  it("writes one line for everything else", async () => {
    await proxy(request("/"));

    expect(console.log).toHaveBeenCalledTimes(1);
  });
});

describe("the gate", () => {
  it.each(["/", "/login", "/register"])("lets an anonymous visitor read %s", async (path) => {
    const response = await proxy(request(path));

    expect(response.status).toBe(200);
  });

  it.each(["/notes", "/settings", "/requests", "/anything-new"])(
    "sends an anonymous visitor from %s to sign in",
    async (path) => {
      const response = await proxy(request(path));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        `http://localhost:3000/login?next=${encodeURIComponent(path)}`,
      );
    },
  );

  it("keeps the query string in the return path", async () => {
    const response = await proxy(request("/requests?outcome=error"));

    expect(response.headers.get("location")).toContain("next=%2Frequests%3Foutcome%3Derror");
  });

  it("answers a gated API call with 401 rather than a redirect", async () => {
    const response = await proxy(request("/api/notes"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required" });
  });

  it.each(["/api/health", "/api/metrics"])("leaves %s open", async (path) => {
    const response = await proxy(request(path));

    expect(response.status).toBe(200);
  });

  it("lets a signed-in visitor through", async () => {
    const response = await proxy(request("/notes", { cookies: `access=${FRESH}` }));

    expect(response.status).toBe(200);
  });

  it("sends a signed-in visitor away from the sign-in page", async () => {
    const response = await proxy(request("/login", { cookies: `access=${FRESH}` }));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/notes");
  });

  it("sends a signed-in visitor away from the sign-up page too", async () => {
    const response = await proxy(request("/register", { cookies: `access=${FRESH}` }));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/notes");
  });

  it("leaves a POST to the sign-in page alone", async () => {
    const response = await proxy(request("/login", { cookies: `access=${FRESH}`, method: "POST" }));

    expect(response.status).toBe(200);
  });
});

describe("the refresh", () => {
  it("rotates a token that is about to expire and forwards the new one", async () => {
    exchangeRefresh.mockResolvedValue({ access_token: FRESH, refresh_token: FRESH });

    const response = await proxy(
      request("/notes", { cookies: `access=${STALE}; refresh=${FRESH}` }),
    );

    expect(exchangeRefresh).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.cookies.get("access")?.value).toBe(FRESH);
    expect(response.headers.get("x-middleware-override-headers")).toContain("cookie");
  });

  it("rotates when the access cookie is gone but the refresh one is not", async () => {
    exchangeRefresh.mockResolvedValue({ access_token: FRESH, refresh_token: FRESH });

    const response = await proxy(request("/notes", { cookies: `refresh=${FRESH}` }));

    expect(response.status).toBe(200);
  });

  it("does not rotate a token with time left on it", async () => {
    await proxy(request("/notes", { cookies: `access=${FRESH}; refresh=${FRESH}` }));

    expect(exchangeRefresh).not.toHaveBeenCalled();
  });

  it("signs the visitor out when the refresh is refused", async () => {
    exchangeRefresh.mockResolvedValue(null);

    const response = await proxy(
      request("/notes", { cookies: `access=${STALE}; refresh=${FRESH}` }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("clears both cookies on a public page after a refused refresh", async () => {
    exchangeRefresh.mockResolvedValue(null);

    const response = await proxy(request("/", { cookies: `access=${STALE}; refresh=${FRESH}` }));

    expect(response.cookies.get("access")?.value).toBe("");
    expect(response.cookies.get("refresh")?.value).toBe("");
  });
});

describe("the rate limit", () => {
  it("throttles a flood of gated API calls", async () => {
    const flood = [];
    for (let attempt = 0; attempt < 62; attempt += 1) {
      flood.push(
        await proxy(request("/api/notes", { headers: { "x-forwarded-for": "10.0.0.9" } })),
      );
    }

    expect(flood.at(-1)?.status).toBe(429);
    expect(flood.at(-1)?.headers.get("retry-after")).toBeTruthy();
  });

  // A Server Action cannot answer with a 429: React would get a body it cannot
  // read and the form would stay pending forever.
  it("leaves server actions to the API to throttle", async () => {
    const attempts = [];
    for (let attempt = 0; attempt < 40; attempt += 1) {
      attempts.push(
        await proxy(
          request("/notes", {
            method: "POST",
            cookies: `access=${FRESH}`,
            headers: { "x-real-ip": "10.0.0.13" },
          }),
        ),
      );
    }

    expect(attempts.every((answer) => answer.status === 200)).toBe(true);
  });

  it("throttles sign-up as tightly as sign-in", async () => {
    const attempts = [];
    for (let attempt = 0; attempt < 12; attempt += 1) {
      attempts.push(
        await proxy(
          request("/register", { method: "POST", headers: { "x-real-ip": "10.0.0.12" } }),
        ),
      );
    }

    expect(attempts[9]?.status).toBe(200);
    expect(attempts.at(-1)?.status).toBe(429);
  });

  it("throttles credential posts sooner", async () => {
    const attempts = [];
    for (let attempt = 0; attempt < 12; attempt += 1) {
      attempts.push(
        await proxy(request("/login", { method: "POST", headers: { "x-real-ip": "10.0.0.11" } })),
      );
    }

    expect(attempts[9]?.status).toBe(200);
    expect(attempts.at(-1)?.status).toBe(429);
  });
});

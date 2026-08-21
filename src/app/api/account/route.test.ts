import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, apiSend } = vi.hoisted(() => ({
  getSession: vi.fn(),
  apiSend: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ getSession }));
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return { ApiError: actual.ApiError, apiSend };
});
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const { ApiError } = await import("@/lib/api-client");
const { PATCH } = await import("@/app/api/account/route");

function patch(body: unknown, contentType = "application/json"): Request {
  return new Request("http://localhost/api/account", {
    method: "PATCH",
    headers: { "content-type": contentType },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({
      userId: "1",
      email: "ada@example.com",
      name: "Ada",
      role: "user",
    });
    apiSend.mockResolvedValue(undefined);
  });

  it("refuses a caller with no session", async () => {
    getSession.mockResolvedValue(null);

    const response = await PATCH(patch({ name: "Ada", email: "ada@example.com" }));

    expect(response.status).toBe(401);
    expect(apiSend).not.toHaveBeenCalled();
  });

  it("passes the profile to the API", async () => {
    const response = await PATCH(patch({ name: "Grace", email: "grace@example.com" }));

    expect(response.status).toBe(200);
    expect(apiSend).toHaveBeenCalledWith("PATCH", "/users/me", {
      name: "Grace",
      email: "grace@example.com",
    });
  });

  it("trims what it was given", async () => {
    await PATCH(patch({ name: "  Grace  ", email: " grace@example.com " }));

    expect(apiSend).toHaveBeenCalledWith("PATCH", "/users/me", {
      name: "Grace",
      email: "grace@example.com",
    });
  });

  it("sends a cleared name as null", async () => {
    await PATCH(patch({ name: "", email: "ada@example.com" }));

    expect(apiSend).toHaveBeenCalledWith("PATCH", "/users/me", {
      name: null,
      email: "ada@example.com",
    });
  });

  it("refuses a body it cannot use", async () => {
    const response = await PATCH(patch({ email: "not-an-email" }));

    expect(response.status).toBe(400);
    expect(apiSend).not.toHaveBeenCalled();
  });

  it("refuses a body that is not JSON", async () => {
    const response = await PATCH(patch({ name: "Ada" }, "text/plain"));

    expect(response.status).toBe(415);
  });

  it("passes the API's refusal through, with its correlation id", async () => {
    apiSend.mockRejectedValue(new ApiError(409, "Email already registered", "req-1"));

    const response = await PATCH(patch({ name: "Ada", email: "taken@example.com" }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Email already registered",
      request_id: "req-1",
    });
  });

  it("lets anything that is not an API failure crash", async () => {
    apiSend.mockRejectedValue(new TypeError("fetch failed"));

    await expect(PATCH(patch({ name: "Ada", email: "ada@example.com" }))).rejects.toBeInstanceOf(
      TypeError,
    );
  });
});

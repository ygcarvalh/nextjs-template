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
const { POST } = await import("@/app/api/account/password/route");

function change(body: unknown): Request {
  return new Request("http://localhost/api/account/password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const GOOD = {
  currentPassword: "old-password",
  newPassword: "new-password",
  confirmation: "new-password",
};

describe("POST /api/account/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({
      userId: "1",
      email: "ada@example.com",
      name: null,
      role: "user",
    });
    apiSend.mockResolvedValue(undefined);
  });

  it("refuses a caller with no session", async () => {
    getSession.mockResolvedValue(null);

    expect((await POST(change(GOOD))).status).toBe(401);
    expect(apiSend).not.toHaveBeenCalled();
  });

  it("hands both passwords to the API under its own names", async () => {
    const response = await POST(change(GOOD));

    expect(response.status).toBe(200);
    expect(apiSend).toHaveBeenCalledWith("POST", "/auth/password", {
      current_password: "old-password",
      new_password: "new-password",
    });
  });

  it.each([
    ["a confirmation that disagrees", { ...GOOD, confirmation: "something-else" }],
    ["a password under the floor", { ...GOOD, newPassword: "short", confirmation: "short" }],
    ["a missing current password", { ...GOOD, currentPassword: "" }],
  ])("refuses %s", async (_case, body) => {
    const response = await POST(change(body));

    expect(response.status).toBe(400);
    expect(apiSend).not.toHaveBeenCalled();
  });

  it("passes the API's refusal through, with its correlation id", async () => {
    apiSend.mockRejectedValue(new ApiError(403, "Current password is incorrect", "req-2"));

    const response = await POST(change(GOOD));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Current password is incorrect",
      request_id: "req-2",
    });
  });
});

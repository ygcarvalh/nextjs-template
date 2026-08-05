import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/features/auth/types";

const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/server", () => ({ getSession: getSessionMock }));

function sessionFor(userId: string): Session {
  return { userId, email: `${userId}@example.com`, expiresAt: Date.now() + 60_000 };
}

// The service is composed as a module singleton, so each test loads a fresh
// copy of the route rather than sharing notes between cases.
async function loadRoute() {
  vi.resetModules();
  return import("@/app/api/notes/route");
}

function postRequest(body: unknown): Request {
  return new Request("http://test/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("notes route handler", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    getSessionMock.mockResolvedValue(sessionFor("alice"));
  });

  it("GET returns an empty list for a new session", async () => {
    const { GET } = await loadRoute();

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ notes: [] });
  });

  it("POST creates a note and returns 201", async () => {
    const { GET, POST } = await loadRoute();

    const response = await POST(postRequest({ text: "hello" }));

    expect(response.status).toBe(201);
    const { note } = await response.json();
    expect(note).toMatchObject({ text: "hello", ownerId: "alice" });

    const listed = await (await GET()).json();
    expect(listed.notes).toHaveLength(1);
  });

  it("POST rejects an invalid body with 400 and names the field", async () => {
    const { POST } = await loadRoute();

    const response = await POST(postRequest({ text: "" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid note");
    expect(body.issues.text).toBeDefined();
  });

  it("POST rejects text beyond the 280 character limit", async () => {
    const { POST } = await loadRoute();

    const response = await POST(postRequest({ text: "x".repeat(281) }));

    expect(response.status).toBe(400);
  });

  it.each([
    ["GET", async () => (await loadRoute()).GET()],
    ["POST", async () => (await loadRoute()).POST(postRequest({ text: "hello" }))],
  ])("%s returns 401 without a session", async (_method, call) => {
    getSessionMock.mockResolvedValue(null);

    const response = await call();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required" });
  });

  it("never returns another owner's notes", async () => {
    const { GET, POST } = await loadRoute();
    await POST(postRequest({ text: "alice's note" }));

    getSessionMock.mockResolvedValue(sessionFor("bob"));
    const response = await GET();

    await expect(response.json()).resolves.toEqual({ notes: [] });
  });
});

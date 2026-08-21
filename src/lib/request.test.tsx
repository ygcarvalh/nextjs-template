import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonRequest, RequestFailed, readProblem } from "@/lib/request";

function answer(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("readProblem", () => {
  beforeEach(() => {
    document.cookie = "x-request-id=from-page";
  });

  it("prefers the id on the response header", async () => {
    const problem = await readProblem(
      answer({ request_id: "from-body" }, 409, { "x-request-id": "from-header" }),
    );

    expect(problem.reference).toEqual({ id: "from-header", source: "response" });
  });

  it("falls back to the id in the body", async () => {
    const problem = await readProblem(answer({ request_id: "from-body" }, 409));

    expect(problem.reference).toEqual({ id: "from-body", source: "response" });
  });

  it("falls back to this page's id and says so", async () => {
    const problem = await readProblem(answer({}, 502));

    expect(problem.reference).toEqual({ id: "from-page", source: "page" });
  });

  it.each([
    [{ message: "Email already registered" }, "Email already registered"],
    [{ error: "Invalid note" }, "Invalid note"],
    [{ detail: "Not authenticated" }, "Not authenticated"],
    [{ detail: [{ msg: "too short" }, { msg: "not an email" }] }, "too short; not an email"],
  ])("reads the message out of %o", async (body, expected) => {
    expect((await readProblem(answer(body, 400))).message).toBe(expected);
  });

  it.each([[{}], [{ detail: [] }], [{ detail: [{ loc: [] }] }], [[1, 2]], ["plain text"]])(
    "has no message for %o",
    async (body) => {
      expect((await readProblem(answer(body, 400))).message).toBeNull();
    },
  );

  it("has no message when the body is not JSON at all", async () => {
    const problem = await readProblem(new Response("<html>502</html>", { status: 502 }));

    expect(problem.message).toBeNull();
  });
});

describe("jsonRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the parsed body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(answer({ notes: [] }, 200)));

    await expect(jsonRequest("/api/notes")).resolves.toEqual({ notes: [] });
  });

  it("throws a failure carrying the status and the reference", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(answer({ error: "nope" }, 409, { "x-request-id": "abc-123" })),
    );

    const error = await jsonRequest("/api/notes").catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(RequestFailed);
    expect((error as RequestFailed).problem).toEqual({
      status: 409,
      message: "nope",
      reference: { id: "abc-123", source: "response" },
    });
  });

  it("reports a rejected fetch as a status of zero", async () => {
    document.cookie = "x-request-id=from-page";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    const error = await jsonRequest("/api/notes").catch((thrown: unknown) => thrown);

    expect((error as RequestFailed).problem).toEqual({
      status: 0,
      message: null,
      reference: { id: "from-page", source: "page" },
    });
  });

  it("carries no reference when the browser has no cookie either", async () => {
    document.cookie = "x-request-id=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    const error = await jsonRequest("/api/notes").catch((thrown: unknown) => thrown);

    expect((error as RequestFailed).problem.reference).toBeNull();
  });

  it("describes itself when there is no message to read", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(answer({}, 500)));

    const error = await jsonRequest("/api/notes").catch((thrown: unknown) => thrown);

    expect((error as RequestFailed).message).toBe("Request failed with status 500");
  });
});

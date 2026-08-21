import { describe, expect, it } from "vitest";
import { MAX_JSON_BODY_BYTES, readJsonBody } from "@/lib/http";

function request(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://test/api", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

describe("readJsonBody", () => {
  it("parses a valid JSON body", async () => {
    const result = await readJsonBody(request(JSON.stringify({ text: "hello" })));

    expect(result).toEqual({ ok: true, value: { text: "hello" } });
  });

  it("accepts a charset parameter on the content type", async () => {
    const result = await readJsonBody(
      request(JSON.stringify({ a: 1 }), { "content-type": "application/json; charset=utf-8" }),
    );

    expect(result.ok).toBe(true);
  });

  it("accepts a +json media type", async () => {
    const result = await readJsonBody(
      request(JSON.stringify({ a: 1 }), { "content-type": "application/merge-patch+json" }),
    );

    expect(result.ok).toBe(true);
  });

  it.each([
    ["text/plain", "text/plain"],
    ["form encoded", "application/x-www-form-urlencoded"],
    ["missing", ""],
  ])("rejects a %s content type with 415", async (_label, contentType) => {
    const result = await readJsonBody(request("{}", { "content-type": contentType }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(415);
    }
  });

  it("returns 400 rather than throwing on malformed JSON", async () => {
    const result = await readJsonBody(request("{not json"));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      await expect(result.response.json()).resolves.toEqual({
        error: "Request body is not valid JSON.",
      });
    }
  });

  it("rejects an oversized body with 413", async () => {
    const oversized = JSON.stringify({ text: "x".repeat(MAX_JSON_BODY_BYTES) });

    const result = await readJsonBody(request(oversized));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(413);
    }
  });

  it("rejects a lying Content-Length that understates an oversized body", async () => {
    const oversized = JSON.stringify({ text: "x".repeat(MAX_JSON_BODY_BYTES) });

    const result = await readJsonBody(request(oversized, { "content-length": "10" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(413);
    }
  });

  it("honours a caller-supplied limit", async () => {
    const result = await readJsonBody(request(JSON.stringify({ text: "hello world" })), 4);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(413);
    }
  });
});

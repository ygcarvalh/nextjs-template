import { afterEach, describe, expect, it, vi } from "vitest";
import { currentRequestId, readRequestIdCookie } from "@/lib/request-id-client";

describe("readRequestIdCookie", () => {
  it("finds the id among other cookies", () => {
    expect(readRequestIdCookie("theme=dark; x-request-id=abc-123; other=1")).toBe("abc-123");
  });

  it("returns null when the cookie is absent", () => {
    expect(readRequestIdCookie("theme=dark")).toBeNull();
  });

  it("rejects a tampered value", () => {
    expect(readRequestIdCookie("x-request-id=two%20words")).toBeNull();
  });
});

describe("currentRequestId", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the cookie the middleware set", () => {
    vi.spyOn(document, "cookie", "get").mockReturnValue("x-request-id=abc-123");
    expect(currentRequestId()).toBe("abc-123");
  });

  it("returns null when no cookie is set", () => {
    vi.spyOn(document, "cookie", "get").mockReturnValue("");
    expect(currentRequestId()).toBeNull();
  });
});

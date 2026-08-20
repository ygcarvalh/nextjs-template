import { describe, expect, it } from "vitest";
import {
  MAX_REQUEST_ID_LENGTH,
  newRequestId,
  resolveRequestId,
  sanitizeRequestId,
} from "@/lib/request-id";

describe("newRequestId", () => {
  it("returns 32 hex characters", () => {
    expect(newRequestId()).toMatch(/^[0-9a-f]{32}$/);
  });

  it("returns a different value each time", () => {
    expect(newRequestId()).not.toBe(newRequestId());
  });
});

describe("sanitizeRequestId", () => {
  it("accepts a minted id", () => {
    const minted = newRequestId();
    expect(sanitizeRequestId(minted)).toBe(minted);
  });

  it("accepts letters, digits, dashes and underscores", () => {
    expect(sanitizeRequestId("abc-123_XYZ")).toBe("abc-123_XYZ");
  });

  it("accepts an id at the length limit", () => {
    const value = "a".repeat(MAX_REQUEST_ID_LENGTH);
    expect(sanitizeRequestId(value)).toBe(value);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty", ""],
    ["a newline", "clean\ninjected"],
    ["a space", "two words"],
    ["an overlong value", "a".repeat(MAX_REQUEST_ID_LENGTH + 1)],
  ])("rejects %s", (_label, value) => {
    expect(sanitizeRequestId(value)).toBeNull();
  });
});

describe("resolveRequestId", () => {
  it("keeps a usable inbound id", () => {
    expect(resolveRequestId("abc-123")).toBe("abc-123");
  });

  it("mints one when the inbound id is unusable", () => {
    expect(resolveRequestId("two words")).toMatch(/^[0-9a-f]{32}$/);
  });
});

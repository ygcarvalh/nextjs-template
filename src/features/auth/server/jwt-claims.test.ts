import { describe, expect, it } from "vitest";
import { expiresWithin, lifetimeSeconds, readExpiry } from "@/features/auth/server/jwt-claims";

function token(payload: object): string {
  const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_");
  return `header.${encoded}.signature`;
}

describe("readExpiry", () => {
  it("reads exp as milliseconds", () => {
    expect(readExpiry(token({ exp: 1_800_000_000 }))).toBe(1_800_000_000_000);
  });

  it.each([
    ["a token with one segment", "nonsense"],
    ["a payload that is not base64", "header..signature"],
  ])("returns null for %s", (_case, value) => {
    expect(readExpiry(value)).toBeNull();
  });

  it("returns null when the payload is not JSON", () => {
    expect(readExpiry(`header.${btoa("not json")}.signature`)).toBeNull();
  });

  it("returns null when there is no exp", () => {
    expect(readExpiry(token({ sub: "1" }))).toBeNull();
  });
});

describe("lifetimeSeconds", () => {
  it("counts the seconds left", () => {
    expect(lifetimeSeconds(token({ exp: 1_060 }), 1_000_000)).toBe(60);
  });

  it("never returns zero", () => {
    expect(lifetimeSeconds(token({ exp: 1 }), 10_000_000)).toBe(1);
  });

  it("assumes the access lifetime when there is no exp", () => {
    expect(lifetimeSeconds("nonsense", 0)).toBe(30 * 60);
  });
});

describe("expiresWithin", () => {
  it("is true inside the skew", () => {
    expect(expiresWithin(token({ exp: 1_000 }), 60_000, 990_000)).toBe(true);
  });

  it("is false outside it", () => {
    expect(expiresWithin(token({ exp: 1_000 }), 60_000, 900_000)).toBe(false);
  });

  it("is true for a token it cannot read", () => {
    expect(expiresWithin("nonsense", 60_000, 0)).toBe(true);
  });
});

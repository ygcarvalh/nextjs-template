import { describe, expect, it } from "vitest";
import { classifyRoute, isApiPath } from "@/features/auth/server/route-gate";

describe("isApiPath", () => {
  it.each(["/api", "/api/notes", "/api/health"])("recognises %s", (path) => {
    expect(isApiPath(path)).toBe(true);
  });

  it.each(["/", "/apiary", "/notes/api"])("leaves %s to the pages", (path) => {
    expect(isApiPath(path)).toBe(false);
  });
});

describe("classifyRoute", () => {
  it.each(["/", "/login", "/register"])("leaves %s open to an anonymous reader", (path) => {
    expect(classifyRoute(path, "GET")).toMatchObject({ api: false, guarded: false });
  });

  it.each(["/notes", "/settings", "/anything-new"])("guards %s by default", (path) => {
    expect(classifyRoute(path, "GET")).toMatchObject({ api: false, guarded: true });
  });

  it.each(["/api/health", "/api/metrics"])("leaves the %s probe open", (path) => {
    expect(classifyRoute(path, "GET")).toMatchObject({ api: true, guarded: false });
  });

  it("guards every other API path", () => {
    expect(classifyRoute("/api/notes", "GET")).toMatchObject({ api: true, guarded: true });
  });

  it.each(["/login", "/register"])("counts a POST to %s as a credential post", (path) => {
    expect(classifyRoute(path, "POST").credentialPost).toBe(true);
    expect(classifyRoute(path, "GET").credentialPost).toBe(false);
  });

  it.each(["/login", "/register"])("sends a signed-in GET of %s away", (path) => {
    expect(classifyRoute(path, "GET").signedOutOnly).toBe(true);
    expect(classifyRoute(path, "POST").signedOutOnly).toBe(false);
  });
});

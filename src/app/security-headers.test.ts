import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

// Locks the response header set in place. A header dropped by accident during
// a refactor fails here rather than in production.
async function headerMap() {
  const rules = await nextConfig.headers?.();
  const rule = rules?.find((entry) => entry.source === "/:path*");
  return new Map(rule?.headers.map((header) => [header.key, header.value]) ?? []);
}

describe("security headers", () => {
  it("disables the framework banner", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it.each([
    ["Content-Security-Policy"],
    ["Strict-Transport-Security"],
    ["X-Content-Type-Options"],
    ["X-Frame-Options"],
    ["Referrer-Policy"],
    ["Permissions-Policy"],
  ])("sets %s on every route", async (header) => {
    expect((await headerMap()).get(header)).toBeDefined();
  });

  it.each([
    ["default-src 'self'"],
    ["frame-ancestors 'none'"],
    ["object-src 'none'"],
    ["base-uri 'self'"],
    ["form-action 'self'"],
  ])("locks down %s", async (directive) => {
    expect((await headerMap()).get("Content-Security-Policy")).toContain(directive);
  });

  it("allows Unsplash images and nothing else remote", async () => {
    const csp = (await headerMap()).get("Content-Security-Policy") ?? "";

    expect(csp).toContain("img-src 'self' https://images.unsplash.com data: blob:");
  });

  it("only permits the Unsplash host through next/image", () => {
    expect(nextConfig.images?.remotePatterns).toEqual([
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ]);
  });

  it("sets a two-year HSTS max-age covering subdomains", async () => {
    expect((await headerMap()).get("Strict-Transport-Security")).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
  });

  it("nosniff is exact", async () => {
    expect((await headerMap()).get("X-Content-Type-Options")).toBe("nosniff");
  });
});

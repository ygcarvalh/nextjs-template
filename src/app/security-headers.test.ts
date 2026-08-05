import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../../next.config";

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

  describe("upgrade-insecure-requests", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    async function policyFor(appUrl: string) {
      vi.resetModules();
      vi.stubEnv("NEXT_PUBLIC_APP_URL", appUrl);
      const { contentSecurityPolicy } = await import("@/lib/security-headers");
      return contentSecurityPolicy;
    }

    it("is set on an https origin", async () => {
      await expect(policyFor("https://example.com")).resolves.toContain(
        "upgrade-insecure-requests",
      );
    });

    it("is omitted on an http origin", async () => {
      await expect(policyFor("http://localhost:3000")).resolves.not.toContain(
        "upgrade-insecure-requests",
      );
    });
  });
});

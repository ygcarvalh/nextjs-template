import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadEnv() {
  vi.resetModules();
  const module = await import("@/env");
  return module.env;
}

describe("env", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("exposes validated values", async () => {
    const env = await loadEnv();

    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(env.AUTH_DEMO_EMAIL).toBe("demo@example.com");
  });

  it("rejects a SESSION_SECRET shorter than 32 characters", async () => {
    vi.stubEnv("SESSION_SECRET", "too-short");

    await expect(loadEnv()).rejects.toThrow("Invalid environment variables");
  });

  it("rejects a malformed NEXT_PUBLIC_APP_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "not-a-url");

    await expect(loadEnv()).rejects.toThrow("Invalid environment variables");
  });

  it("rejects a missing required server variable", async () => {
    vi.stubEnv("AUTH_DEMO_EMAIL", "");

    await expect(loadEnv()).rejects.toThrow("Invalid environment variables");
  });
});

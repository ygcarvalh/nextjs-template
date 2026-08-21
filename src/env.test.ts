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
    expect(env.API_URL).toBe("http://127.0.0.1:8000/api/v1");
    expect(env.API_TIMEOUT_MS).toBe(10_000);
    expect(env.FEATURE_FLAGS).toBe("notes");
  });

  it("rejects an API_URL that is not a URL", async () => {
    vi.stubEnv("API_URL", "127.0.0.1:8000");

    await expect(loadEnv()).rejects.toThrow("Invalid environment variables");
  });

  it("rejects a missing API_URL", async () => {
    vi.stubEnv("API_URL", "");

    await expect(loadEnv()).rejects.toThrow("Invalid environment variables");
  });

  it("rejects a malformed NEXT_PUBLIC_APP_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "not-a-url");

    await expect(loadEnv()).rejects.toThrow("Invalid environment variables");
  });

  it("rejects a timeout that is not a positive number", async () => {
    vi.stubEnv("API_TIMEOUT_MS", "-5");

    await expect(loadEnv()).rejects.toThrow("Invalid environment variables");
  });
});

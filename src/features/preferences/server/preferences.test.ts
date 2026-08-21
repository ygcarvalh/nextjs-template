import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-client";
import { cookieJar, type Jar, mockNextHeaders } from "../../../../test/next-headers";

const { apiGet, apiSend } = vi.hoisted(() => ({ apiGet: vi.fn(), apiSend: vi.fn() }));

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return { ApiError: actual.ApiError, apiGet, apiSend };
});

async function load(): Promise<{
  jar: Jar;
  module: typeof import("@/features/preferences/server/preferences");
}> {
  vi.resetModules();
  const jar = cookieJar();
  mockNextHeaders(jar);
  return { jar, module: await import("@/features/preferences/server/preferences") };
}

describe("readPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps what the API stored", async () => {
    apiGet.mockResolvedValue({
      locale: "pt-BR",
      theme: "dark",
      show_request_id: false,
      features: "notes",
    });
    const { module } = await load();

    await expect(module.readPreferences()).resolves.toEqual({
      locale: "pt-BR",
      theme: "dark",
      showRequestId: false,
      features: "notes",
    });
  });

  it("falls back to the default language for one it does not ship", async () => {
    apiGet.mockResolvedValue({
      locale: "fr-FR",
      theme: "system",
      show_request_id: true,
      features: null,
    });
    const { module } = await load();

    await expect(module.readPreferences()).resolves.toMatchObject({ locale: "en-US" });
  });

  it("returns nothing for a visitor with no account", async () => {
    apiGet.mockRejectedValue(new ApiError(401, "no session", null));
    const { module } = await load();

    await expect(module.readPreferences()).resolves.toBeNull();
  });

  it("returns nothing when the row is malformed", async () => {
    apiGet.mockResolvedValue({
      locale: "pt-BR",
      theme: "sepia",
      show_request_id: true,
      features: null,
    });
    const { module } = await load();

    await expect(module.readPreferences()).resolves.toBeNull();
  });

  it("lets anything that is not an API failure through", async () => {
    apiGet.mockRejectedValue(new TypeError("fetch failed"));
    const { module } = await load();

    await expect(module.readPreferences()).rejects.toBeInstanceOf(TypeError);
  });
});

describe("savePreferences", () => {
  it("patches only what changed", async () => {
    apiSend.mockResolvedValue(undefined);
    const { module } = await load();

    await module.savePreferences({ theme: "light" });

    expect(apiSend).toHaveBeenCalledWith("PATCH", "/users/me/preferences", { theme: "light" });
  });
});

describe("adoptStoredPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes the account's language and chrome into cookies", async () => {
    apiGet.mockResolvedValue({
      locale: "pt-BR",
      theme: "dark",
      show_request_id: false,
      features: null,
    });
    const { jar, module } = await load();

    await module.adoptStoredPreferences();

    expect(jar.get("locale")?.value).toBe("pt-BR");
    expect(JSON.parse(jar.get("preferences")?.value ?? "{}")).toEqual({
      theme: "dark",
      showRequestId: false,
    });
  });

  it("leaves the cookies alone when there is nothing stored", async () => {
    apiGet.mockRejectedValue(new ApiError(401, "no session", null));
    const { jar, module } = await load();

    await module.adoptStoredPreferences();

    expect(jar.get("locale")).toBeUndefined();
    expect(jar.get("preferences")).toBeUndefined();
  });
});

describe("the chrome cookie", () => {
  it("defaults for a visitor who has never chosen", async () => {
    const { module } = await load();

    await expect(module.readChromePreferences()).resolves.toEqual({
      theme: "system",
      showRequestId: true,
    });
  });

  it("keeps what it was not asked to change", async () => {
    const { jar, module } = await load();

    await module.rememberChromePreference({ theme: "light" });
    await module.rememberChromePreference({ showRequestId: false });

    await expect(module.readChromePreferences()).resolves.toEqual({
      theme: "light",
      showRequestId: false,
    });
    expect(jar.options.get("preferences")).toMatchObject({ httpOnly: true, path: "/" });
  });
});

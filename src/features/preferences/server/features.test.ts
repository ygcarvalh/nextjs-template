import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-client";

const { apiGet, readPreferences } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  readPreferences: vi.fn(),
}));

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return { ApiError: actual.ApiError, apiGet };
});
vi.mock("@/features/preferences/server/preferences", () => ({ readPreferences }));

async function load() {
  vi.resetModules();
  return import("@/features/preferences/server/features");
}

describe("enabledFlags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("follows the environment for an account that named nothing", async () => {
    readPreferences.mockResolvedValue({ features: null });
    const { enabledFlags } = await load();

    await expect(enabledFlags()).resolves.toEqual(new Set(["notes"]));
  });

  it("follows the environment for a visitor with no account", async () => {
    readPreferences.mockResolvedValue(null);
    const { enabledFlags } = await load();

    await expect(enabledFlags()).resolves.toEqual(new Set(["notes"]));
  });

  it("lets the account's own list win", async () => {
    readPreferences.mockResolvedValue({ features: "" });
    const { enabledFlags } = await load();

    await expect(enabledFlags()).resolves.toEqual(new Set());
  });
});

describe("followsEnvironment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [null, true],
    [{ features: null }, true],
    [{ features: "" }, false],
    [{ features: "notes" }, false],
  ])("reads %o as %s", async (stored, expected) => {
    readPreferences.mockResolvedValue(stored);
    const { followsEnvironment } = await load();

    await expect(followsEnvironment()).resolves.toBe(expected);
  });
});

describe("apiFeatures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readPreferences.mockResolvedValue(null);
  });

  it("reads what the API says it serves", async () => {
    apiGet.mockResolvedValue({ flags: ["items", "request-log"] });
    const { apiFeatures } = await load();

    await expect(apiFeatures()).resolves.toEqual(new Set(["items", "request-log"]));
  });

  it("assumes nothing when the API refuses", async () => {
    apiGet.mockRejectedValue(new ApiError(401, "no session", null));
    const { apiFeatures } = await load();

    await expect(apiFeatures()).resolves.toEqual(new Set());
  });

  it.each([[{}], [{ flags: "notes" }], [{ flags: [1, "items"] }]])(
    "keeps only the names in %o",
    async (answer) => {
      apiGet.mockResolvedValue(answer);
      const { apiFeatures } = await load();

      const served = await apiFeatures();
      expect([...served].every((flag) => typeof flag === "string")).toBe(true);
    },
  );

  it("lets anything that is not an API failure through", async () => {
    apiGet.mockRejectedValue(new TypeError("fetch failed"));
    const { apiFeatures } = await load();

    await expect(apiFeatures()).rejects.toBeInstanceOf(TypeError);
  });
});

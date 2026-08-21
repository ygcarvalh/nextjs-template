import { describe, expect, it, vi } from "vitest";
import { cookieJar, headerBag, mockNextHeaders } from "../../test/next-headers";

async function load(cookie: string | null, header: string | null) {
  vi.resetModules();
  mockNextHeaders(
    cookieJar(cookie ? { locale: cookie } : {}),
    headerBag(header ? { "accept-language": header } : {}),
  );
  return import("@/i18n/server");
}

describe("getLocale", () => {
  it("prefers the cookie", async () => {
    const { getLocale } = await load("pt-BR", "en-US");

    await expect(getLocale()).resolves.toBe("pt-BR");
  });

  it("falls back to the browser's preference", async () => {
    const { getLocale } = await load(null, "pt-BR,pt;q=0.9");

    await expect(getLocale()).resolves.toBe("pt-BR");
  });

  it("settles on the default", async () => {
    const { getLocale } = await load(null, null);

    await expect(getLocale()).resolves.toBe("en-US");
  });
});

describe("getDictionary", () => {
  it("returns the resolved language's words", async () => {
    const { getDictionary } = await load("pt-BR", null);

    await expect(getDictionary()).resolves.toMatchObject({ chrome: { settings: "Ajustes" } });
  });
});

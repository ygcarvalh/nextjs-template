import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, negotiateLocale, parseLocale } from "@/i18n/locale";

describe("parseLocale", () => {
  it.each(["en-US", "pt-BR"])("takes %s", (value) => {
    expect(parseLocale(value)).toBe(value);
  });

  it.each([null, undefined, "", "fr-FR", "en"])("refuses %s", (value) => {
    expect(parseLocale(value)).toBeNull();
  });
});

describe("negotiateLocale", () => {
  it("prefers the cookie", () => {
    expect(negotiateLocale("pt-BR", "en-US,en;q=0.9")).toBe("pt-BR");
  });

  it("ignores a cookie it does not ship", () => {
    expect(negotiateLocale("fr-FR", "pt-BR")).toBe("pt-BR");
  });

  it("reads the header when there is no cookie", () => {
    expect(negotiateLocale(null, "pt-BR,pt;q=0.9")).toBe("pt-BR");
  });

  it("matches a primary subtag", () => {
    expect(negotiateLocale(null, "pt")).toBe("pt-BR");
  });

  it("weighs quality over written order", () => {
    expect(negotiateLocale(null, "en-US;q=0.2,pt-BR;q=0.9")).toBe("pt-BR");
  });

  it("treats an unparseable quality as no preference", () => {
    expect(negotiateLocale(null, "pt-BR;q=nonsense,en-US")).toBe("en-US");
  });

  it("skips an empty entry", () => {
    expect(negotiateLocale(null, ",pt-BR")).toBe("pt-BR");
  });

  it.each([null, undefined, "", "fr-FR,de-DE"])("falls back on %s", (header) => {
    expect(negotiateLocale(null, header)).toBe(DEFAULT_LOCALE);
  });
});

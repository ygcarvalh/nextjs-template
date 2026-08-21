import { describe, expect, it } from "vitest";
import { parseTheme, preferencesSchema } from "@/features/preferences/types";

describe("parseTheme", () => {
  it.each(["light", "dark", "system"])("takes %s", (value) => {
    expect(parseTheme(value)).toBe(value);
  });

  it.each([null, "sepia", 7])("refuses %s", (value) => {
    expect(parseTheme(value)).toBeNull();
  });
});

describe("preferencesSchema", () => {
  it("takes what the API returns", () => {
    expect(
      preferencesSchema.parse({
        locale: "pt-BR",
        theme: "dark",
        show_request_id: false,
        features: null,
      }),
    ).toEqual({ locale: "pt-BR", theme: "dark", show_request_id: false, features: null });
  });

  it("refuses an unknown theme", () => {
    expect(
      preferencesSchema.safeParse({ locale: "pt-BR", theme: "sepia", show_request_id: true })
        .success,
    ).toBe(false);
  });
});

describe("the stored feature list", () => {
  it("may name nothing at all", () => {
    expect(
      preferencesSchema.parse({
        locale: "en-US",
        theme: "system",
        show_request_id: true,
        features: "",
      }).features,
    ).toBe("");
  });

  it("is refused when it is not a string or null", () => {
    expect(
      preferencesSchema.safeParse({
        locale: "en-US",
        theme: "system",
        show_request_id: true,
        features: 7,
      }).success,
    ).toBe(false);
  });
});

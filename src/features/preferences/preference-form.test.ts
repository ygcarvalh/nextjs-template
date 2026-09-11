import { describe, expect, it } from "vitest";
import { formOf } from "@/features/preferences/preference-form";

describe("formOf", () => {
  it("builds a one-field form the actions can read", () => {
    const form = formOf("theme", "dark");

    expect(form.get("theme")).toBe("dark");
    expect([...form.keys()]).toEqual(["theme"]);
  });
});

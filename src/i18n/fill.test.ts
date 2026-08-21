import { describe, expect, it } from "vitest";
import { fill } from "@/i18n/fill";

describe("fill", () => {
  it("puts a value in a slot", () => {
    expect(fill("Showing {first} of {total}", { first: 1, total: 9 })).toBe("Showing 1 of 9");
  });

  it("repeats one value in every slot", () => {
    expect(fill("{name} and {name}", { name: "Ada" })).toBe("Ada and Ada");
  });

  it("leaves a slot it was given nothing for", () => {
    expect(fill("Hello {name}", {})).toBe("Hello {name}");
  });

  it("returns a template with no slots untouched", () => {
    expect(fill("Nothing to fill", { name: "Ada" })).toBe("Nothing to fill");
  });
});

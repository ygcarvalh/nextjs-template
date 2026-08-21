import { describe, expect, it } from "vitest";
import { coverForNote } from "@/features/notes/covers";

describe("coverForNote", () => {
  it("returns the same cover for the same id", () => {
    expect(coverForNote("note-1")).toBe(coverForNote("note-1"));
  });

  it("spreads different ids across more than one photo", () => {
    const covers = new Set(Array.from({ length: 40 }, (_, index) => coverForNote(`note-${index}`)));

    expect(covers.size).toBeGreaterThan(1);
  });

  it("only ever points at the allow-listed host", () => {
    for (let index = 0; index < 40; index += 1) {
      expect(new URL(coverForNote(`note-${index}`)).host).toBe("images.unsplash.com");
    }
  });

  it("handles an empty id without breaking", () => {
    expect(() => new URL(coverForNote(""))).not.toThrow();
  });
});

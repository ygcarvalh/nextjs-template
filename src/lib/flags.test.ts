import { describe, expect, it } from "vitest";
import { flagState, parseFlags, resolveFlags, serializeFlags } from "@/lib/flags";

describe("parseFlags", () => {
  it("takes the names it knows", () => {
    expect([...parseFlags("notes")]).toEqual(["notes"]);
  });

  it("ignores a name it does not know", () => {
    expect([...parseFlags("notes,teleporter")]).toEqual(["notes"]);
  });

  it("trims what it is given", () => {
    expect([...parseFlags(" notes , ")]).toEqual(["notes"]);
  });

  it.each([undefined, null, ""])("enables nothing for %s", (raw) => {
    expect([...parseFlags(raw)]).toEqual([]);
  });
});

describe("serializeFlags", () => {
  it("writes the names back in a stable order", () => {
    expect(serializeFlags(["notes"])).toBe("notes");
  });

  it("writes nothing for nothing", () => {
    expect(serializeFlags([])).toBe("");
  });
});

describe("resolveFlags", () => {
  it("follows the environment when the account named nothing", () => {
    expect([...resolveFlags("notes", null)]).toEqual(["notes"]);
  });

  it("lets the account's list win", () => {
    expect([...resolveFlags("notes", "")]).toEqual([]);
  });

  it("lets the account turn something on the environment left out", () => {
    expect([...resolveFlags("", "notes")]).toEqual(["notes"]);
  });
});

describe("flagState", () => {
  it("reports every flag either way", () => {
    expect(flagState(parseFlags(""))).toEqual({ notes: false });
    expect(flagState(parseFlags("notes"))).toEqual({ notes: true });
  });
});

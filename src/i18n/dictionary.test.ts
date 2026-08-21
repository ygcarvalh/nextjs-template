import { describe, expect, it } from "vitest";
import { enUS } from "@/i18n/dictionaries/en-US";
import { ptBR } from "@/i18n/dictionaries/pt-BR";
import { dictionaryFor } from "@/i18n/dictionary";
import { LOCALES } from "@/i18n/locale";

type Leaf = { path: string; kind: string; value: string };

const DELIBERATELY_ALIKE = new Set([
  "chrome.robots",
  "chrome.sitemap",
  "notFound.eyebrow",
  "home.eyebrow",
  "settings.flagsHead",
  "requests.columnStatus",
]);

function leaves(dictionary: object, prefix = ""): Leaf[] {
  return Object.entries(dictionary).flatMap(([key, value]) => {
    const path = prefix === "" ? key : `${prefix}.${key}`;
    if (typeof value === "object" && value !== null) {
      return leaves(value, path);
    }
    return [{ path, kind: typeof value, value: String(value) }];
  });
}

function slots(value: string): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

const english = leaves(enUS);
const portuguese = leaves(ptBR);

describe("dictionaries", () => {
  it("hold the same key paths of the same leaf type", () => {
    expect(portuguese.map(({ path, kind }) => `${path}:${kind}`).sort()).toEqual(
      english.map(({ path, kind }) => `${path}:${kind}`).sort(),
    );
  });

  it.each([
    ["en-US", english],
    ["pt-BR", portuguese],
  ])("leave nothing blank in %s", (_locale, entries) => {
    for (const leaf of entries) {
      expect(leaf.value.trim().length).toBeGreaterThan(0);
    }
  });

  it.each([
    ["en-US", english],
    ["pt-BR", portuguese],
  ])("hold no functions in %s", (_locale, entries) => {
    for (const leaf of entries) {
      expect(leaf.kind).not.toBe("function");
    }
  });

  it("ask for the same slots in both languages", () => {
    const translated = new Map(portuguese.map((leaf) => [leaf.path, leaf.value]));

    for (const leaf of english) {
      expect(slots(translated.get(leaf.path) ?? "")).toEqual(slots(leaf.value));
    }
  });

  it("say something different in each language", () => {
    const translated = new Map(portuguese.map((leaf) => [leaf.path, leaf.value]));
    const identical = english
      .filter((leaf) => translated.get(leaf.path) === leaf.value)
      .map((leaf) => leaf.path)
      .filter((path) => !DELIBERATELY_ALIKE.has(path));

    expect(identical).toEqual([]);
  });

  it.each(LOCALES)("resolves %s", (locale) => {
    expect(dictionaryFor(locale).chrome.settings.length).toBeGreaterThan(0);
  });
});

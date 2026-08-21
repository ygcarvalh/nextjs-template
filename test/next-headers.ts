import { vi } from "vitest";

export type Jar = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: unknown): void;
  delete(name: string): void;
  entries: Map<string, string>;
  options: Map<string, unknown>;
};

export function cookieJar(initial: Record<string, string> = {}): Jar {
  const entries = new Map(Object.entries(initial));
  const options = new Map<string, unknown>();
  return {
    get: (name) => (entries.has(name) ? { value: entries.get(name) as string } : undefined),
    set: (name, value, option) => {
      entries.set(name, value);
      options.set(name, option);
    },
    delete: (name) => {
      entries.delete(name);
    },
    entries,
    options,
  };
}

export function headerBag(initial: Record<string, string> = {}) {
  const bag = new Map(Object.entries(initial));
  return { get: (name: string) => bag.get(name) ?? null };
}

export function mockNextHeaders(jar: Jar, headers = headerBag()) {
  vi.doMock("next/headers", () => ({
    cookies: () => Promise.resolve(jar),
    headers: () => Promise.resolve(headers),
  }));
}

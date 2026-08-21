import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PreferenceStore } from "@/features/preferences/components/preference-store";
import { LOCALE_STORAGE_KEY } from "@/features/preferences/types";

const setTheme = vi.fn();

vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme }) }));

function storage() {
  const entries = new Map<string, string>();
  return {
    entries,
    setItem: vi.fn((key: string, value: string) => {
      entries.set(key, value);
    }),
    getItem: (key: string) => entries.get(key) ?? null,
  };
}

beforeEach(() => {
  setTheme.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PreferenceStore", () => {
  it("mirrors the language into local storage", () => {
    const store = storage();
    vi.stubGlobal("localStorage", store);

    render(<PreferenceStore locale="pt-BR" theme={null} />);

    expect(store.entries.get(LOCALE_STORAGE_KEY)).toBe("pt-BR");
  });

  it("applies a stored theme once", () => {
    vi.stubGlobal("localStorage", storage());

    const { rerender } = render(<PreferenceStore locale="en-US" theme="dark" />);
    rerender(<PreferenceStore locale="en-US" theme="dark" />);

    expect(setTheme).toHaveBeenCalledExactlyOnceWith("dark");
  });

  it("leaves the theme alone when the account stored none", () => {
    vi.stubGlobal("localStorage", storage());

    render(<PreferenceStore locale="en-US" theme={null} />);

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("survives a browser with storage blocked", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("blocked");
      },
    });

    expect(() => render(<PreferenceStore locale="pt-BR" theme={null} />)).not.toThrow();
  });
});

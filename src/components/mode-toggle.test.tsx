import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModeToggle } from "@/components/mode-toggle";
import { chooseTheme } from "@/features/preferences/server/preference-actions";
import { enUS } from "@/i18n/dictionaries/en-US";

const setTheme = vi.fn();

vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme }) }));
vi.mock("@/features/preferences/server/preference-actions", () => ({ chooseTheme: vi.fn() }));

describe("ModeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("labels the trigger for screen readers", () => {
    render(<ModeToggle />);

    expect(screen.getByRole("button", { name: enUS.chrome.toggleTheme })).toBeInTheDocument();
  });

  it.each([
    [enUS.chrome.themeLight, "light"],
    [enUS.chrome.themeDark, "dark"],
    [enUS.chrome.themeSystem, "system"],
  ])("selects the %s theme and remembers it on the account", async (label, value) => {
    render(<ModeToggle />);

    await userEvent.click(screen.getByRole("button", { name: enUS.chrome.toggleTheme }));
    await userEvent.click(await screen.findByRole("menuitem", { name: label }));

    expect(setTheme).toHaveBeenCalledWith(value);
    expect(vi.mocked(chooseTheme).mock.calls[0][0].get("theme")).toBe(value);
  });
});

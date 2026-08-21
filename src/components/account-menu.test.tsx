import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountMenu } from "@/components/account-menu";
import { chooseLocale, chooseTheme } from "@/features/preferences/server/preference-actions";
import { enUS } from "@/i18n/dictionaries/en-US";

const setTheme = vi.fn();

vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme }) }));
vi.mock("@/features/auth/server/auth-actions", () => ({ signOut: vi.fn() }));
vi.mock("@/features/preferences/server/preference-actions", () => ({
  chooseLocale: vi.fn().mockResolvedValue(undefined),
  chooseTheme: vi.fn(),
}));

async function open() {
  render(<AccountMenu locale="en-US" />);
  await userEvent.click(screen.getByRole("button", { name: enUS.chrome.account }));
}

describe("AccountMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gathers language, theme and the way out behind one control", async () => {
    await open();

    expect(await screen.findByRole("menuitem", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Português" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: enUS.chrome.signOut })).toBeInTheDocument();
  });

  it.each([
    [enUS.chrome.themeLight, "light"],
    [enUS.chrome.themeDark, "dark"],
    [enUS.chrome.themeSystem, "system"],
  ])("sets the %s theme and remembers it on the account", async (label, value) => {
    await open();

    await userEvent.click(await screen.findByRole("menuitem", { name: label }));

    expect(setTheme).toHaveBeenCalledWith(value);
    const form = vi.mocked(chooseTheme).mock.calls[0][0];
    expect(form.get("theme")).toBe(value);
  });

  it("stores the language it was asked for", async () => {
    await open();

    await userEvent.click(await screen.findByRole("menuitem", { name: "Português" }));

    expect(vi.mocked(chooseLocale).mock.calls[0][0].get("locale")).toBe("pt-BR");
  });

  it("marks the language in use", async () => {
    await open();

    expect(await screen.findByRole("menuitem", { name: "English" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("menuitem", { name: "Português" })).not.toHaveAttribute("aria-current");
  });

  // The region rule is off because the popup is portalled to the body, where it
  // sits outside every landmark by design.
  it("has no detectable accessibility violations with the menu open", async () => {
    await open();
    await screen.findByRole("menuitem", { name: enUS.chrome.signOut });

    await expect(
      axe(document.body, { rules: { region: { enabled: false } } }),
    ).resolves.toHaveNoViolations();
  });
});

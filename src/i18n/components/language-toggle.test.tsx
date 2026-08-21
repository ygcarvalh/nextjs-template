import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chooseLocale } from "@/features/preferences/server/preference-actions";
import { LanguageToggle } from "@/i18n/components/language-toggle";
import { LOCALE_NAMES } from "@/i18n/locale";

const reload = vi.fn();
vi.mock("@/features/preferences/server/preference-actions", () => ({
  chooseLocale: vi.fn().mockResolvedValue(undefined),
}));

describe("LanguageToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("location", { reload });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("offers every language it ships", () => {
    render(<LanguageToggle current="en-US" />);

    for (const name of Object.values(LOCALE_NAMES)) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("names each control by its language, not its country", () => {
    render(<LanguageToggle current="en-US" />);

    expect(screen.getByRole("button", { name: "Português" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /brazil/i })).not.toBeInTheDocument();
  });

  it("marks the current language", () => {
    render(<LanguageToggle current="pt-BR" />);

    expect(screen.getByRole("button", { name: "Português" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "English" })).not.toHaveAttribute("aria-current");
  });

  it("stores the choice and renders the page again in it", async () => {
    render(<LanguageToggle current="en-US" />);

    await userEvent.click(screen.getByRole("button", { name: "Português" }));

    expect(vi.mocked(chooseLocale).mock.calls[0][0].get("locale")).toBe("pt-BR");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  // A click that lands before hydration has to do something, so each control
  // is a submit button inside a form the server action can take on its own.
  it("still submits without JavaScript", () => {
    const { container } = render(<LanguageToggle current="en-US" />);

    expect(
      [...container.querySelectorAll('form input[name="locale"]')].map((input) =>
        input.getAttribute("value"),
      ),
    ).toEqual(["en-US", "pt-BR"]);
    expect(screen.getByRole("button", { name: "Português" })).toHaveAttribute("type", "submit");
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(<LanguageToggle current="en-US" />);

    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});

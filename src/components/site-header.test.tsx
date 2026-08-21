import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "@/components/site-header";
import { enUS } from "@/i18n/dictionaries/en-US";

vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme: vi.fn() }) }));

function header(children?: React.ReactNode, themeToggle?: boolean) {
  return (
    <SiteHeader
      navLabel={enUS.chrome.mainNavigation}
      brand={enUS.chrome.brand}
      themeToggle={themeToggle}
    >
      {children}
    </SiteHeader>
  );
}

describe("SiteHeader", () => {
  it("exposes a named navigation landmark", () => {
    render(header());

    expect(
      screen.getByRole("navigation", { name: enUS.chrome.mainNavigation }),
    ).toBeInTheDocument();
  });

  it("links the wordmark home", () => {
    render(header());

    expect(screen.getByRole("link", { name: enUS.chrome.brand })).toHaveAttribute("href", "/");
  });

  it("renders the theme toggle", () => {
    render(header());

    expect(screen.getByRole("button", { name: enUS.chrome.toggleTheme })).toBeInTheDocument();
  });

  it("omits the toggle when something else carries the theme", () => {
    render(header(undefined, false));

    expect(screen.queryByRole("button", { name: enUS.chrome.toggleTheme })).not.toBeInTheDocument();
  });

  it("renders slotted actions alongside the toggle", () => {
    render(header(<button type="button">Sign out</button>));

    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});

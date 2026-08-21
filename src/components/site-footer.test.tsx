import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "@/components/site-footer";
import { enUS } from "@/i18n/dictionaries/en-US";

describe("SiteFooter", () => {
  it("exposes a named footer navigation", () => {
    render(<SiteFooter t={enUS} />);

    expect(
      screen.getByRole("navigation", { name: enUS.chrome.footerNavigation }),
    ).toBeInTheDocument();
  });

  it.each([
    [enUS.chrome.health, "/api/health"],
    [enUS.chrome.robots, "/robots.txt"],
    [enUS.chrome.sitemap, "/sitemap.xml"],
  ])("links %s to %s", (label, href) => {
    render(<SiteFooter t={enUS} />);

    expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "@/components/site-footer";

describe("SiteFooter", () => {
  it("exposes a named footer navigation", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("navigation", { name: "Footer" })).toBeInTheDocument();
  });

  it.each([
    ["Health", "/api/health"],
    ["robots.txt", "/robots.txt"],
    ["Sitemap", "/sitemap.xml"],
  ])("links %s to %s", (label, href) => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
  });
});

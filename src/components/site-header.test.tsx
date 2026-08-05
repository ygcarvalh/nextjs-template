import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "@/components/site-header";

vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme: vi.fn() }) }));

describe("SiteHeader", () => {
  it("exposes a named navigation landmark", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });

  it("links the wordmark home", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "Next.js Template" })).toHaveAttribute("href", "/");
  });

  it("renders the theme toggle", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
  });

  it("renders slotted actions alongside the toggle", () => {
    render(
      <SiteHeader>
        <button type="button">Sign out</button>
      </SiteHeader>,
    );

    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});

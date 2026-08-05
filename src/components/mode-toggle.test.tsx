import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModeToggle } from "@/components/mode-toggle";

const setTheme = vi.fn();

vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme }) }));

describe("ModeToggle", () => {
  beforeEach(() => {
    setTheme.mockReset();
  });

  it("labels the trigger for screen readers", () => {
    render(<ModeToggle />);

    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
  });

  it.each([
    ["Light", "light"],
    ["Dark", "dark"],
    ["System", "system"],
  ])("selects the %s theme", async (label, value) => {
    render(<ModeToggle />);

    await userEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: label }));

    expect(setTheme).toHaveBeenCalledWith(value);
  });
});

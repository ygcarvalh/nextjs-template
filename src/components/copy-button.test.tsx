import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "@/components/copy-button";
import { enUS } from "@/i18n/dictionaries/en-US";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CopyButton", () => {
  it("labels itself for a screen reader", () => {
    render(<CopyButton value="abc-123" />);

    expect(screen.getByRole("button", { name: enUS.requests.copyReference })).toBeInTheDocument();
  });

  it("takes a label of its own", () => {
    render(<CopyButton value="abc-123" label="Copy id" />);

    expect(screen.getByRole("button", { name: "Copy id" })).toBeInTheDocument();
  });

  it("copies the value and announces it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<CopyButton value="abc-123" />);
    await userEvent.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith("abc-123");
    expect(screen.getByText(enUS.requests.copied)).toBeInTheDocument();
  });
});

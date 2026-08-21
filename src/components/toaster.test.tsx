import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Toaster } from "@/components/toaster";
import { toast } from "@/components/ui/toast";
import { enUS } from "@/i18n/dictionaries/en-US";

function Trigger({ type }: { type: "warning" | "error" }) {
  return (
    <button
      type="button"
      onClick={() => toast.add({ type, title: `a ${type}`, description: "abc-123" })}
    >
      raise
    </button>
  );
}

async function raise(type: "warning" | "error") {
  const view = render(
    <Toaster>
      <Trigger type={type} />
    </Toaster>,
  );
  await userEvent.click(screen.getByRole("button", { name: "raise" }));
  return view;
}

describe("Toaster", () => {
  it("names the region it announces from", () => {
    render(
      <Toaster>
        <p>content</p>
      </Toaster>,
    );

    expect(screen.getByRole("region", { name: enUS.toast.region })).toBeInTheDocument();
  });

  it.each(["warning", "error"] as const)(
    "marks a %s so the stylesheet can treat it",
    async (type) => {
      const { container } = await raise(type);

      expect(await screen.findByText(`a ${type}`)).toBeInTheDocument();
      expect(
        container.ownerDocument.querySelector(`[data-slot="toast"][data-type="${type}"]`),
      ).not.toBeNull();
    },
  );

  // Base UI keeps the close control out of the accessibility tree until the
  // viewport is hovered or focused, so this one is queried by its slot.
  it("closes on the dismiss control", async () => {
    await raise("warning");
    await screen.findByText("a warning");
    const close = document.querySelector('[data-slot="toast-close"]');

    expect(close).toHaveAttribute("aria-label", enUS.toast.dismiss);
    await userEvent.click(close as HTMLElement);

    expect(screen.queryByText("a warning")).not.toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = await raise("error");
    await screen.findByText("a error");

    await expect(axe(container.ownerDocument.body)).resolves.toHaveNoViolations();
  });
});

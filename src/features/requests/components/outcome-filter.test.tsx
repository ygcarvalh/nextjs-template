import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OutcomeFilter } from "@/features/requests/components/outcome-filter";
import { enUS } from "@/i18n/dictionaries/en-US";

const requestSubmit = vi.fn();

beforeEach(() => {
  requestSubmit.mockReset();
  HTMLFormElement.prototype.requestSubmit = requestSubmit;
});

function filter(current: "success" | "warning" | "error" | null = null) {
  return render(
    <form method="get">
      <OutcomeFilter current={current} />
    </form>,
  );
}

describe("OutcomeFilter", () => {
  it("shows the outcome already filtered on", () => {
    filter("error");

    expect(screen.getByRole("combobox", { name: enUS.requests.filterOutcome })).toHaveTextContent(
      enUS.requests.outcomeError,
    );
  });

  it("submits it so the value reaches the URL", () => {
    const { container } = filter("warning");

    expect(container.querySelector('input[name="outcome"]')).toHaveValue("warning");
  });

  it("offers every outcome plus no filter at all", async () => {
    filter();

    await userEvent.click(screen.getByRole("combobox", { name: enUS.requests.filterOutcome }));

    expect(await screen.findAllByRole("option")).toHaveLength(4);
  });

  it("filters as soon as an outcome is picked", async () => {
    filter();

    await userEvent.click(screen.getByRole("combobox", { name: enUS.requests.filterOutcome }));
    await userEvent.click(
      await screen.findByRole("option", { name: enUS.requests.outcomeWarning }),
    );

    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("filters again when the reader clears it", async () => {
    filter("warning");

    await userEvent.click(screen.getByRole("combobox", { name: enUS.requests.filterOutcome }));
    await userEvent.click(await screen.findByRole("option", { name: enUS.requests.outcomeAny }));

    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });
});

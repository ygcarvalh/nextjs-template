import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useProblemToast } from "@/components/problem-toast";
import { Toaster } from "@/components/toaster";
import { enUS } from "@/i18n/dictionaries/en-US";
import { type Problem, RequestFailed } from "@/lib/request";

function Reporter({ error }: { error: unknown }) {
  const report = useProblemToast();
  return (
    <button type="button" onClick={() => report(error, "the fallback sentence")}>
      report
    </button>
  );
}

async function report(error: unknown, showReference = true) {
  const view = render(
    <Toaster showReference={showReference}>
      <Reporter error={error} />
    </Toaster>,
  );
  await userEvent.click(screen.getByRole("button", { name: "report" }));
  return view;
}

function failure(problem: Partial<Problem>): RequestFailed {
  return new RequestFailed({
    status: 409,
    message: "Email already registered",
    reference: { id: "abc-123", source: "response" },
    ...problem,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useProblemToast", () => {
  it("calls a 4xx a refusal", async () => {
    await report(failure({}));

    expect(await screen.findByText(enUS.toast.warningTitle)).toBeInTheDocument();
    expect(screen.getByText("Email already registered")).toBeInTheDocument();
    expect(screen.getByText("abc-123")).toBeInTheDocument();
  });

  it("calls a 5xx an error and announces it urgently", async () => {
    await report(failure({ status: 500, message: null }));

    const titles = await screen.findAllByText(enUS.toast.errorTitle);
    expect(titles.length).toBeGreaterThan(1);
    expect(screen.getAllByText("the fallback sentence").length).toBeGreaterThan(0);
    expect(document.querySelector('[data-slot="toast"][data-type="error"]')).not.toBeNull();
  });

  it("explains a reference that belongs to the page rather than the request", async () => {
    await report(failure({ status: 0, reference: { id: "page-1", source: "page" } }));

    expect((await screen.findAllByText(enUS.toast.pageReference)).length).toBeGreaterThan(0);
  });

  it("says so when nothing carried a reference", async () => {
    await report(failure({ reference: null }));

    expect(await screen.findByText(enUS.toast.noReference)).toBeInTheDocument();
  });

  it("hides the reference when the account asked it to", async () => {
    await report(failure({}), false);

    expect(await screen.findByText(enUS.toast.noReference)).toBeInTheDocument();
    expect(screen.queryByText("abc-123")).not.toBeInTheDocument();
  });

  it("treats anything that is not a request failure as an error", async () => {
    await report(new Error("boom"));

    expect((await screen.findAllByText(enUS.toast.errorTitle)).length).toBeGreaterThan(0);
  });

  it("offers a copy action for the reference", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await report(failure({}));
    await screen.findByText("abc-123");
    const action = document.querySelector('[data-slot="toast-action"]');

    expect(action).toHaveTextContent(enUS.toast.copyReference);
    await userEvent.click(action as HTMLElement);

    expect(writeText).toHaveBeenCalledWith("abc-123");
  });
});

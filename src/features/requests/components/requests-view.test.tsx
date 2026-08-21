import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { RequestsEmpty } from "@/features/requests/components/requests-empty";
import { RequestsFilters } from "@/features/requests/components/requests-filters";
import { RequestsPager } from "@/features/requests/components/requests-pager";
import { RequestsTable } from "@/features/requests/components/requests-table";
import type { RequestFilters, RequestLog } from "@/features/requests/types";
import { enUS } from "@/i18n/dictionaries/en-US";

const noFilters: RequestFilters = { outcome: null, path: null, requestId: null, cursor: null };

function entry(overrides: Partial<RequestLog> = {}): RequestLog {
  return {
    id: 1,
    request_id: "abc-123",
    method: "GET",
    path: "/api/v1/items",
    status_code: 200,
    duration_ms: 1.25,
    client_ip: "127.0.0.1",
    user_id: 7,
    created_at: "2026-08-20T12:00:00.000Z",
    outcome: "success",
    ...overrides,
  };
}

describe("RequestsTable", () => {
  it("renders one row per entry, with a header row on top", () => {
    render(
      <RequestsTable
        entries={[entry(), entry({ id: 2, request_id: "def-456" })]}
        t={enUS}
        locale="en-US"
      />,
    );

    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it.each([
    ["success", 200, enUS.requests.outcomeSuccess, "text-pass"],
    ["warning", 404, enUS.requests.outcomeWarning, "text-warning"],
    ["error", 500, enUS.requests.outcomeError, "text-destructive"],
  ] as const)("labels a %s row and colours it", (outcome, status, label, colour) => {
    render(
      <RequestsTable entries={[entry({ outcome, status_code: status })]} t={enUS} locale="en-US" />,
    );

    const badge = screen.getByText(`${status} ${label}`);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain(colour);
  });

  it("offers the correlation id with a way to copy it", () => {
    render(<RequestsTable entries={[entry()]} t={enUS} locale="en-US" />);

    expect(screen.getByText("abc-123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: enUS.requests.copyReference })).toBeInTheDocument();
  });

  it("renders the timestamp as a machine-readable time", () => {
    const { container } = render(<RequestsTable entries={[entry()]} t={enUS} locale="en-US" />);

    expect(container.querySelector("time")).toHaveAttribute("dateTime", "2026-08-20T12:00:00.000Z");
  });
});

describe("RequestsFilters", () => {
  it("keeps the filters in the URL through a plain GET form", () => {
    const { container } = render(
      <RequestsFilters filters={{ ...noFilters, outcome: "error", path: "/api" }} t={enUS} />,
    );

    expect(container.querySelector("form")).toHaveAttribute("method", "get");
    expect(screen.getByLabelText(enUS.requests.filterPath)).toHaveValue("/api");
    expect(screen.getByLabelText(enUS.requests.filterReference)).toBeInTheDocument();
  });

  it("carries the outcome the reader already chose", () => {
    const { container } = render(
      <RequestsFilters filters={{ ...noFilters, outcome: "error" }} t={enUS} />,
    );

    expect(container.querySelector('input[name="outcome"]')).toHaveValue("error");
  });
});

describe("RequestsPager", () => {
  it("counts the rows on this page", () => {
    render(
      <RequestsPager
        page={{ items: [entry(), entry({ id: 2 })], limit: 20, next_cursor: null }}
        filters={noFilters}
        t={enUS}
      />,
    );

    expect(screen.getByText("2 on this page")).toBeInTheDocument();
  });

  it("offers nothing to click on a first page that is also the last", () => {
    render(
      <RequestsPager
        page={{ items: [entry()], limit: 20, next_cursor: null }}
        filters={noFilters}
        t={enUS}
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("offers the older page with the filters and the cursor", () => {
    render(
      <RequestsPager
        page={{ items: [entry()], limit: 20, next_cursor: "cur-2" }}
        filters={{ ...noFilters, outcome: "error" }}
        t={enUS}
      />,
    );

    expect(screen.getByRole("link", { name: enUS.requests.older })).toHaveAttribute(
      "href",
      "/requests?outcome=error&cursor=cur-2",
    );
  });

  it("offers the way back to the newest once a cursor is in play", () => {
    render(
      <RequestsPager
        page={{ items: [entry()], limit: 20, next_cursor: null }}
        filters={{ ...noFilters, outcome: "error", cursor: "cur-1" }}
        t={enUS}
      />,
    );

    expect(screen.getByRole("link", { name: enUS.requests.newest })).toHaveAttribute(
      "href",
      "/requests?outcome=error",
    );
  });

  it("counts nothing when there is nothing", () => {
    render(
      <RequestsPager
        page={{ items: [], limit: 20, next_cursor: null }}
        filters={noFilters}
        t={enUS}
      />,
    );

    expect(screen.getByText("0 on this page")).toBeInTheDocument();
  });
});

describe("RequestsEmpty", () => {
  it("says nothing matched and why that might be", () => {
    render(<RequestsEmpty t={enUS} />);

    expect(screen.getByText(enUS.requests.emptyTitle)).toBeInTheDocument();
    expect(screen.getByText(enUS.requests.emptyLede)).toBeInTheDocument();
  });
});

describe("the requests screen accessibility", () => {
  it("has no detectable violations", async () => {
    const { container } = render(
      <main>
        <RequestsFilters filters={noFilters} t={enUS} />
        <RequestsTable entries={[entry()]} t={enUS} locale="en-US" />
        <RequestsPager
          page={{ items: [entry()], limit: 20, next_cursor: null }}
          filters={noFilters}
          t={enUS}
        />
      </main>,
    );

    await expect(axe(container)).resolves.toHaveNoViolations();
  });

  it("has no detectable violations when empty", async () => {
    const { container } = render(
      <main>
        <RequestsEmpty t={enUS} />
      </main>,
    );

    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});

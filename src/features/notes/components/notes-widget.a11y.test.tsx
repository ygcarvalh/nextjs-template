import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotesWidget } from "@/features/notes/components/notes-widget";
import { enUS } from "@/i18n/dictionaries/en-US";

vi.mock("@/components/problem-toast", () => ({ useProblemToast: () => vi.fn() }));

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubNotes(notes: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ notes }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ),
  );
}

describe("NotesWidget accessibility", () => {
  it("has no detectable violations when empty", async () => {
    stubNotes([]);
    const { container } = render(<NotesWidget />);
    await screen.findByText(enUS.notes.emptyTitle);

    await expect(axe(container)).resolves.toHaveNoViolations();
  });

  it("has no detectable violations with notes present", async () => {
    stubNotes([
      { id: "1", ownerId: "alice", text: "first", createdAt: "2026-08-05T12:00:00.000Z" },
      { id: "2", ownerId: "alice", text: "second", createdAt: "2026-08-05T13:00:00.000Z" },
    ]);
    const { container } = render(<NotesWidget />);
    await screen.findByText("first");

    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});

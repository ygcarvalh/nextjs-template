import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotesWidget } from "@/features/notes/components/notes-widget";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubNotes(notes: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ notes }),
    }),
  );
}

describe("NotesWidget accessibility", () => {
  it("has no detectable violations when empty", async () => {
    stubNotes([]);
    const { container } = render(<NotesWidget />);
    await screen.findByText("No notes yet");

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

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotesWidget } from "@/features/notes/components/notes-widget";

describe("NotesWidget", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and renders existing notes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ notes: [{ id: "1", text: "first", createdAt: "now" }] }),
      }),
    );

    render(<NotesWidget />);

    expect(await screen.findByText("first")).toBeInTheDocument();
  });

  it("posts a new note and shows it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ notes: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ note: { id: "2", text: "added", createdAt: "now" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ notes: [{ id: "2", text: "added", createdAt: "now" }] }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesWidget />);
    const input = await screen.findByLabelText("Note text");
    await userEvent.type(input, "added");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/notes",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByText("added")).toBeInTheDocument();
  });
});

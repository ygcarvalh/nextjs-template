import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotesWidget } from "@/features/notes/components/notes-widget";
import type { Note } from "@/features/notes/types";

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: "1",
    ownerId: "alice",
    text: "first",
    createdAt: "2026-08-05T12:00:00.000Z",
    ...overrides,
  };
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

describe("NotesWidget", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the notes it loads", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ notes: [note()] })));

    render(<NotesWidget />);

    expect(await screen.findByText("first")).toBeInTheDocument();
  });

  it("invites the first note when the board is empty", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ notes: [] })));

    render(<NotesWidget />);

    expect(await screen.findByText("No notes yet")).toBeInTheDocument();
  });

  it("posts a new note and shows it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ notes: [] }))
      .mockResolvedValueOnce(jsonResponse({ note: note({ id: "2", text: "added" }) }, true, 201))
      .mockResolvedValueOnce(jsonResponse({ notes: [note({ id: "2", text: "added" })] }));
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesWidget />);
    await userEvent.type(await screen.findByLabelText("Note text"), "added");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/notes",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByText("added")).toBeInTheDocument();
  });

  it("reports a rejected note instead of silently clearing the field", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ notes: [] }))
      .mockResolvedValueOnce(jsonResponse({ error: "You can keep at most 50 notes." }, false, 409));
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesWidget />);
    const input = await screen.findByLabelText("Note text");
    await userEvent.type(input, "one too many");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("at most 50 notes");
    expect(input).toHaveValue("one too many");
  });

  it("reports a network failure while saving", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ notes: [] }))
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesWidget />);
    await userEvent.type(await screen.findByLabelText("Note text"), "note");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be saved");
  });

  it("reports a failed load rather than showing an empty board", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "nope" }, false, 401)));

    render(<NotesWidget />);

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be loaded");
    expect(screen.queryByText("No notes yet")).not.toBeInTheDocument();
  });

  it("does not submit an empty note", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ notes: [] }));
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesWidget />);
    await screen.findByText("No notes yet");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotesWidget } from "@/features/notes/components/notes-widget";
import type { Note } from "@/features/notes/types";
import { enUS } from "@/i18n/dictionaries/en-US";

const { report } = vi.hoisted(() => ({ report: vi.fn() }));

vi.mock("@/components/problem-toast", () => ({ useProblemToast: () => report }));

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: "1",
    ownerId: "alice",
    text: "first",
    createdAt: "2026-08-05T12:00:00.000Z",
    ...overrides,
  };
}

function answer(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "x-request-id": "req-abc123" },
  });
}

describe("NotesWidget", () => {
  beforeEach(() => {
    report.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the notes it loads", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(answer({ notes: [note()] })));

    render(<NotesWidget />);

    expect(await screen.findByText("first")).toBeInTheDocument();
  });

  it("invites the first note when the board is empty", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(answer({ notes: [] })));

    render(<NotesWidget />);

    expect(await screen.findByText(enUS.notes.emptyTitle)).toBeInTheDocument();
  });

  it("posts a new note and shows it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(answer({ notes: [] }))
      .mockResolvedValueOnce(answer({ note: note({ id: "2", text: "added" }) }, 201))
      .mockResolvedValueOnce(answer({ notes: [note({ id: "2", text: "added" })] }));
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesWidget />);
    await userEvent.type(await screen.findByLabelText(enUS.notes.inputLabel), "added");
    await userEvent.click(screen.getByRole("button", { name: enUS.notes.add }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/notes",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByText("added")).toBeInTheDocument();
  });

  // A refused write raises a toast, which is what carries the correlation id.
  it("reports a rejected note instead of silently clearing the field", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(answer({ notes: [] }))
      .mockResolvedValueOnce(answer({ error: "You can keep at most 50 notes." }, 409));
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesWidget />);
    const input = await screen.findByLabelText(enUS.notes.inputLabel);
    await userEvent.type(input, "one too many");
    await userEvent.click(screen.getByRole("button", { name: enUS.notes.add }));

    await waitFor(() => expect(report).toHaveBeenCalledTimes(1));
    expect(report.mock.calls[0][0]).toMatchObject({
      problem: { status: 409, message: "You can keep at most 50 notes." },
    });
    expect(input).toHaveValue("one too many");
  });

  it("reports a network failure while saving", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(answer({ notes: [] }))
      .mockRejectedValueOnce(new TypeError("offline"));
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesWidget />);
    await userEvent.type(await screen.findByLabelText(enUS.notes.inputLabel), "note");
    await userEvent.click(screen.getByRole("button", { name: enUS.notes.add }));

    await waitFor(() => expect(report).toHaveBeenCalledTimes(1));
    expect(report.mock.calls[0][0]).toMatchObject({ problem: { status: 0 } });
  });

  // A load failure stays on the page: a toast would leave an empty board with
  // no explanation once it faded.
  it("keeps a failed load on the page rather than in a toast", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(answer({ error: "nope" }, 401)));

    render(<NotesWidget />);

    expect(await screen.findByRole("alert")).toHaveTextContent(enUS.notes.loadFailed);
    expect(screen.queryByText(enUS.notes.emptyTitle)).not.toBeInTheDocument();
    expect(report).not.toHaveBeenCalled();
  });

  it("reports a network failure while loading", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    render(<NotesWidget />);

    expect(await screen.findByRole("alert")).toHaveTextContent(enUS.notes.loadFailed);
  });

  it("does not submit an empty note", async () => {
    const fetchMock = vi.fn().mockResolvedValue(answer({ notes: [] }));
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesWidget />);
    await screen.findByText(enUS.notes.emptyTitle);
    await userEvent.click(screen.getByRole("button", { name: enUS.notes.add }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

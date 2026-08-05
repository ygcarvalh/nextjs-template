"use client";

import { CircleAlert, NotebookPen, Plus } from "lucide-react";
import Image from "next/image";
import { type FormEvent, useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { coverForNote } from "@/features/notes/covers";
import type { Note } from "@/features/notes/types";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

type Status = "loading" | "ready" | "failed";

export function NotesWidget() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputId = useId();
  const errorId = useId();

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notes");
      if (!response.ok) {
        setStatus("failed");
        return;
      }
      const data = await response.json();
      setNotes(data.notes);
      setStatus("ready");
    } catch {
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "The note could not be saved.");
        return;
      }

      setText("");
      await load();
    } catch {
      setError("The note could not be saved. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-labelledby="notes-heading">
      <h1 id="notes-heading" className="font-semibold text-2xl tracking-[-0.02em]">
        Notes
      </h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Scoped to your session. Another account signing in sees an empty board.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex gap-2">
        <Input
          id={inputId}
          aria-label="Note text"
          value={text}
          maxLength={280}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a note…"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
        />
        <Button type="submit" disabled={isSaving}>
          <Plus aria-hidden />
          {isSaving ? "Adding…" : "Add"}
        </Button>
      </form>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 flex items-center gap-2 text-destructive text-sm"
        >
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      {status === "loading" ? (
        <p className="mt-8 text-muted-foreground text-sm" aria-live="polite">
          Loading your notes…
        </p>
      ) : null}

      {status === "failed" ? (
        <p className="mt-8 flex items-center gap-2 text-destructive text-sm" role="alert">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          Your notes could not be loaded. Reload the page to try again.
        </p>
      ) : null}

      {status === "ready" && notes.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
          <NotebookPen
            aria-hidden
            className="mx-auto size-6 text-muted-foreground"
            strokeWidth={1.5}
          />
          <p className="mt-3 font-medium text-sm">No notes yet</p>
          <p className="mt-1 text-muted-foreground text-sm">
            Write one above and it appears here, with a cover derived from its id.
          </p>
        </div>
      ) : null}

      {notes.length > 0 ? (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {notes.map((note) => (
            <li key={note.id} className="overflow-hidden rounded-lg border bg-card">
              <div className="relative aspect-[16/9] bg-muted">
                <Image
                  src={coverForNote(note.id)}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 20rem, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-sm leading-relaxed">{note.text}</p>
                <p className="mt-3 font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
                  {dateFormat.format(new Date(note.createdAt))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

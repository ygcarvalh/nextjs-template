"use client";

import { CircleAlert, NotebookPen, Plus } from "lucide-react";
import Image from "next/image";
import { type FormEvent, useCallback, useEffect, useId, useState } from "react";
import { useProblemToast } from "@/components/problem-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { coverForNote } from "@/features/notes/covers";
import type { Note } from "@/features/notes/types";
import { useDictionary, useLocale } from "@/i18n/provider";
import { jsonRequest } from "@/lib/request";

type Status = "loading" | "ready" | "failed";

export function NotesWidget() {
  const t = useDictionary();
  const locale = useLocale();
  const report = useProblemToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputId = useId();

  const dateFormat = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  // A load failure stays on the page: a toast that vanishes would leave an
  // empty board with no explanation.
  const load = useCallback(async () => {
    try {
      const data = await jsonRequest<{ notes: Note[] }>("/api/notes");
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
    try {
      await jsonRequest("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      setText("");
      await load();
    } catch (error) {
      report(error, t.notes.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-labelledby="notes-heading">
      <h1 id="notes-heading" className="font-semibold text-2xl tracking-[-0.02em]">
        {t.notes.heading}
      </h1>
      <p className="mt-2 text-muted-foreground text-sm">{t.notes.lede}</p>

      <form onSubmit={onSubmit} className="mt-6 flex gap-2">
        <Input
          id={inputId}
          aria-label={t.notes.inputLabel}
          value={text}
          maxLength={280}
          onChange={(event) => setText(event.target.value)}
          placeholder={t.notes.placeholder}
        />
        <Button type="submit" disabled={isSaving}>
          <Plus aria-hidden />
          {isSaving ? t.notes.adding : t.notes.add}
        </Button>
      </form>

      {status === "loading" ? (
        <p className="mt-8 text-muted-foreground text-sm" aria-live="polite">
          {t.notes.loading}
        </p>
      ) : null}

      {status === "failed" ? (
        <p className="mt-8 flex items-center gap-2 text-destructive text-sm" role="alert">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {t.notes.loadFailed}
        </p>
      ) : null}

      {status === "ready" && notes.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
          <NotebookPen
            aria-hidden
            className="mx-auto size-6 text-muted-foreground"
            strokeWidth={1.5}
          />
          <p className="mt-3 font-medium text-sm">{t.notes.emptyTitle}</p>
          <p className="mt-1 text-muted-foreground text-sm">{t.notes.emptyLede}</p>
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

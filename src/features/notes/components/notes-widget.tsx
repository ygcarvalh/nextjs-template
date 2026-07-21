"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Note } from "@/features/notes/types";

export function NotesWidget() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/notes");
    const data = await res.json();
    setNotes(data.notes);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
    setText("");
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            aria-label="Note text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a note..."
          />
          <Button type="submit">Add</Button>
        </form>
        <ul className="space-y-1 text-sm">
          {notes.map((note) => (
            <li key={note.id}>{note.text}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

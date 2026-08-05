import { beforeEach, describe, expect, it } from "vitest";
import type { Session } from "@/features/auth/types";
import { createInMemoryNotesRepository } from "@/features/notes/server/in-memory-notes-repository";
import type { NotesRepository } from "@/features/notes/server/notes-repository";
import {
  createNotesService,
  MAX_NOTES_PER_OWNER,
  type NotesService,
} from "@/features/notes/server/notes-service";

function sessionFor(userId: string): Session {
  return { userId, email: `${userId}@example.com`, expiresAt: Date.now() + 60_000 };
}

const alice = sessionFor("alice");
const bob = sessionFor("bob");

describe("notes service", () => {
  let repository: NotesRepository;
  let service: NotesService;

  beforeEach(() => {
    repository = createInMemoryNotesRepository();
    service = createNotesService(repository);
  });

  it("starts empty", async () => {
    await expect(service.list(alice)).resolves.toEqual([]);
  });

  it("creates a note owned by the session user", async () => {
    const result = await service.create(alice, { text: "first" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.note).toMatchObject({ text: "first", ownerId: "alice" });
      expect(result.note.id).toEqual(expect.any(String));
      expect(Date.parse(result.note.createdAt)).not.toBeNaN();
    }
  });

  it("returns the newest note first", async () => {
    await service.create(alice, { text: "older" });
    await service.create(alice, { text: "newer" });

    const notes = await service.list(alice);

    expect(notes.map((note) => note.text)).toEqual(["newer", "older"]);
  });

  it("never leaks another owner's notes", async () => {
    await service.create(alice, { text: "alice's secret" });
    await service.create(bob, { text: "bob's note" });

    await expect(service.list(bob)).resolves.toMatchObject([{ text: "bob's note" }]);
    await expect(service.list(alice)).resolves.toMatchObject([{ text: "alice's secret" }]);
  });

  it("refuses to exceed the per-owner limit", async () => {
    for (let index = 0; index < MAX_NOTES_PER_OWNER; index += 1) {
      await service.create(alice, { text: `note ${index}` });
    }

    const result = await service.create(alice, { text: "one too many" });

    expect(result).toEqual({ ok: false, reason: "limit-reached", limit: MAX_NOTES_PER_OWNER });
    await expect(service.list(alice)).resolves.toHaveLength(MAX_NOTES_PER_OWNER);
  });

  it("counts the limit per owner, not globally", async () => {
    for (let index = 0; index < MAX_NOTES_PER_OWNER; index += 1) {
      await service.create(alice, { text: `note ${index}` });
    }

    await expect(service.create(bob, { text: "bob is unaffected" })).resolves.toMatchObject({
      ok: true,
    });
  });
});

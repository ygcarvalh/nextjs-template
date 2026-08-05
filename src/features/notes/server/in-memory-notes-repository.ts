import type { NotesRepository } from "@/features/notes/server/notes-repository";
import type { Note } from "@/features/notes/types";

// A factory rather than a module-level array: every call owns its state, so
// tests get a clean repository by constructing one instead of reaching into
// module scope to reset a shared array.
//
// State lives in the process, which means it is lost on restart and is not
// shared between instances. Fine for a demo, wrong for anything real — that is
// exactly what the NotesRepository port is here to make easy to replace.
export function createInMemoryNotesRepository(seed: readonly Note[] = []): NotesRepository {
  const notes: Note[] = [...seed];

  return {
    async listByOwner(ownerId) {
      return notes.filter((note) => note.ownerId === ownerId).reverse();
    },

    async countByOwner(ownerId) {
      return notes.reduce((total, note) => (note.ownerId === ownerId ? total + 1 : total), 0);
    },

    async add(note) {
      const created: Note = {
        ...note,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      notes.push(created);
      return created;
    },
  };
}

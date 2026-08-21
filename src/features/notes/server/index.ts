import "server-only";
import { createInMemoryNotesRepository } from "@/features/notes/server/in-memory-notes-repository";
import { createNotesService } from "@/features/notes/server/notes-service";

export type { NewNote, NotesRepository } from "@/features/notes/server/notes-repository";
export {
  type CreateNoteResult,
  createNotesService,
  MAX_NOTES_PER_OWNER,
  type NotesService,
} from "@/features/notes/server/notes-service";
export { createInMemoryNotesRepository };

export const notesService = createNotesService(createInMemoryNotesRepository());

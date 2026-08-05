import { z } from "zod";

export const noteSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  text: z.string().min(1).max(280),
  createdAt: z.string(),
});

export const createNoteSchema = noteSchema.pick({ text: true });

export type Note = z.infer<typeof noteSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;

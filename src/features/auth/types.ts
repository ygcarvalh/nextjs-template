import { z } from "zod";

export const sessionSchema = z.object({
  userId: z.string().min(1),
  email: z.email(),
  expiresAt: z.number().int().positive(),
});

export const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type Session = z.infer<typeof sessionSchema>;
export type Credentials = z.infer<typeof credentialsSchema>;

import { z } from "zod";

export const ROLES = ["user", "admin"] as const;

// The API enforces the same floor; a form that checks it first saves a round trip.
export const MIN_PASSWORD_LENGTH = 8;

export const userReadSchema = z.object({
  id: z.number().int().positive(),
  email: z.email(),
  name: z.string().nullable(),
  role: z.enum(ROLES),
});

export const sessionSchema = z.object({
  userId: z.string().min(1),
  email: z.email(),
  name: z.string().nullable(),
  role: z.enum(ROLES),
});

export const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type UserRead = z.infer<typeof userReadSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Credentials = z.infer<typeof credentialsSchema>;
export type Role = (typeof ROLES)[number];

export function toSession(user: UserRead): Session {
  return {
    userId: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

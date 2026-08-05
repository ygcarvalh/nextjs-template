import "server-only";
import { env } from "@/env";
import type { SessionIdentity } from "@/features/auth/server/session-provider";
import type { Credentials } from "@/features/auth/types";

const encoder = new TextEncoder();

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

// Comparing fixed-length digests keeps the check constant time and, unlike a
// byte-wise compare of the raw strings, leaks nothing about input length.
async function equalsInConstantTime(left: string, right: string): Promise<boolean> {
  const [a, b] = await Promise.all([digest(left), digest(right)]);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index];
  }
  return difference === 0;
}

export async function verifyCredentials(credentials: Credentials): Promise<SessionIdentity | null> {
  // Both comparisons always run, so a wrong email costs the same as a wrong
  // password and the response time reveals nothing about which was wrong.
  const [emailMatches, passwordMatches] = await Promise.all([
    equalsInConstantTime(credentials.email.toLowerCase(), env.AUTH_DEMO_EMAIL.toLowerCase()),
    equalsInConstantTime(credentials.password, env.AUTH_DEMO_PASSWORD),
  ]);

  if (!emailMatches || !passwordMatches) {
    return null;
  }

  return { userId: "demo-user", email: env.AUTH_DEMO_EMAIL };
}

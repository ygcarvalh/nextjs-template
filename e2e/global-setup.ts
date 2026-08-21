import { mkdirSync, writeFileSync } from "node:fs";
import { ACCOUNT_FILE, credentialsFromEnv } from "./support";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000/api/v1";

async function reachable(): Promise<boolean> {
  const health = new URL("/health", API_URL);
  const response = await fetch(health, { signal: AbortSignal.timeout(3000) }).catch(() => null);
  return Boolean(response?.ok);
}

// The signed-in suite changes a name and a password, so it gets an account of
// its own rather than mutating one somebody else is using.
async function register(): Promise<{ email: string; password: string }> {
  const account = {
    email: `e2e-${Date.now().toString(36)}@example.com`,
    password: `e2e-${Math.random().toString(36).slice(2)}-password`,
  };

  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...account, name: "End to end" }),
  });

  if (!response.ok) {
    throw new Error(
      `The API refused to register an end-to-end account (${response.status}). ` +
        "Registration may be rate limited; wait a minute and try again.",
    );
  }

  return account;
}

export default async function globalSetup(): Promise<void> {
  if (!(await reachable())) {
    throw new Error(
      `The API at ${API_URL} did not answer. Start the sibling fastapi-template first: docker compose up -d`,
    );
  }

  const account = credentialsFromEnv() ?? (await register());
  mkdirSync("test-results", { recursive: true });
  writeFileSync(ACCOUNT_FILE, JSON.stringify(account), "utf8");
}

import { existsSync, readFileSync, rmSync } from "node:fs";
import { ACCOUNT_FILE, type Account } from "./support";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000/api/v1";

// A run that registers its own account owns it, and leaving one behind on every
// run is how a database fills with e2e-*@example.com.
export default async function globalTeardown(): Promise<void> {
  if (process.env.E2E_EMAIL || !existsSync(ACCOUNT_FILE)) {
    return;
  }

  const account = JSON.parse(readFileSync(ACCOUNT_FILE, "utf8")) as Account;
  const tokens = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: account.email, password: account.password }),
  })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);

  if (tokens?.access_token) {
    await fetch(`${API_URL}/users/me`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${tokens.access_token}` },
    }).catch(() => null);
  }

  rmSync(ACCOUNT_FILE, { force: true });
}

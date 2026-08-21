import { readFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";

export const ACCOUNT_FILE = "test-results/e2e-account.json";
export const STORAGE_STATE = "test-results/storage-state.json";

export const baseURL = `http://localhost:${process.env.E2E_PORT ?? 3200}`;

export type Account = { email: string; password: string };

// Naming an account keeps the suite off a shared one; leaving them unset lets
// the run register its own.
export function credentialsFromEnv(): Account | null {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  return email && password ? { email, password } : null;
}

export function account(): Account {
  return JSON.parse(readFileSync(ACCOUNT_FILE, "utf8")) as Account;
}

// A form only reacts once React has taken over, so a click landing before that
// does nothing at all. PreferenceStore mirrors the
// locale into localStorage on mount, which makes it a precise signal that a
// client effect has run — no test hook in the app needed.
export async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() => localStorage.getItem("locale") !== null, null, {
    timeout: 15_000,
  });
}

// This retries rather than clicking once because React hydrates island by
// island, and a click landing before this form woke up does nothing at all.
// Anything a Server Action drives also waits on the route rendering again, and
// on a machine that is running the API, a database and a dev server too, that
// commit can take seconds — so the outer window is generous on purpose.
export async function submitUntil(
  submit: () => Promise<void>,
  settled: () => Promise<void>,
): Promise<void> {
  await expect(async () => {
    await submit();
    await settled();
  }).toPass({ timeout: 30_000, intervals: [500, 1500, 3000] });
}

export async function signIn(page: Page, password?: string): Promise<void> {
  const credentials = account();
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(password ?? credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

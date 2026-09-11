import { readFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";

export const ACCOUNT_FILE = "test-results/e2e-account.json";
export const STORAGE_STATE = "test-results/storage-state.json";

export const baseURL = `http://localhost:${process.env.E2E_PORT ?? 3200}`;

export type Account = { email: string; password: string };

export function credentialsFromEnv(): Account | null {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  return email && password ? { email, password } : null;
}

export function account(): Account {
  return JSON.parse(readFileSync(ACCOUNT_FILE, "utf8")) as Account;
}

export async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() => localStorage.getItem("locale") !== null, null, {
    timeout: 15_000,
  });
}

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

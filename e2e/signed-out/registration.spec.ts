import { expect, test } from "@playwright/test";
import { account, submitUntil } from "../support";

// The suite runs against a database that outlives it, so every run signs up as
// somebody new.
function newcomer(): string {
  return `signup-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test("the sign-in page offers a way in for someone with no account", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("link", { name: "Create one" }).click();

  await expect(page).toHaveURL("/register");
  await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
});

test("a newcomer signs up and lands inside", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill(newcomer());
  await page.getByLabel("Password", { exact: true }).fill("Marmalade4Toast");
  await page.getByLabel("Repeat password").fill("Marmalade4Toast");

  await submitUntil(
    () => page.getByRole("button", { name: "Create account" }).click(),
    () => expect(page).toHaveURL("/notes", { timeout: 6000 }),
  );
});

test("the meter rates the password as it is typed", async ({ page }) => {
  await page.goto("/register");

  await page.getByLabel("Password", { exact: true }).fill("marmalade");
  await expect(page.getByText("Password strength: Weak")).toBeVisible();

  await page.getByLabel("Password", { exact: true }).fill("Marmalade4Toast");
  await expect(page.getByText("Password strength: Strong")).toBeVisible();
});

test("two passwords that differ never reach the API", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill(newcomer());
  await page.getByLabel("Password", { exact: true }).fill("Marmalade4Toast");
  await page.getByLabel("Repeat password").fill("Marmalade4Toasted");

  await submitUntil(
    () => page.getByRole("button", { name: "Create account" }).click(),
    () =>
      expect(page.locator("form").getByRole("alert")).toHaveText("The two passwords don't match.", {
        timeout: 6000,
      }),
  );
  await expect(page).toHaveURL("/register");
});

test("an address that already has an account is turned down", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill(account().email);
  await page.getByLabel("Password", { exact: true }).fill("Marmalade4Toast");
  await page.getByLabel("Repeat password").fill("Marmalade4Toast");

  await submitUntil(
    () => page.getByRole("button", { name: "Create account" }).click(),
    () =>
      expect(page.locator("form").getByRole("alert")).toHaveText(
        "That email address already has an account.",
        { timeout: 6000 },
      ),
  );
});

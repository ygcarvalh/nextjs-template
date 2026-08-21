import { expect, test } from "@playwright/test";
import { ready } from "../support";

test("creates a note and shows it after a reload", async ({ page }) => {
  await page.goto("/notes");
  await ready(page);

  const text = `note from the e2e run ${test.info().testId}`;
  await page.getByLabel("Note text").fill(text);
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText(text)).toBeVisible();

  await page.reload();
  await expect(page.getByText(text)).toBeVisible();
});

test("answers an unknown URL with a real 404", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-route");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /nothing at this address/i })).toBeVisible();
});

test("signing out closes access again", async ({ page }) => {
  await page.goto("/notes");
  await ready(page);

  await page.getByRole("button", { name: "Account and preferences" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();

  await expect(page).toHaveURL("/");
  await page.goto("/notes");
  await expect(page).toHaveURL("/login?next=%2Fnotes");
});

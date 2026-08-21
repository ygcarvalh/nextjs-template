import { expect, test } from "@playwright/test";
import { ready } from "../support";

const REFERENCE = "e2e-forced-failure-001";

// The API is not made to fail on demand, so the failure is injected at the one
// hop the browser owns: its own route handler.
async function refuse(page: import("@playwright/test").Page, status: number) {
  await page.route("**/api/notes", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      headers: { "content-type": "application/json", "x-request-id": REFERENCE },
      body: JSON.stringify({ error: "The note could not be saved.", request_id: REFERENCE }),
    });
  });
}

async function writeANote(page: import("@playwright/test").Page) {
  await page.goto("/notes");
  await ready(page);
  await page.getByLabel("Note text").fill(`toast ${test.info().testId}`);
  await page.getByRole("button", { name: "Add" }).click();
}

test("a server error raises a toast carrying the correlation id", async ({ page }) => {
  await refuse(page, 500);
  await writeANote(page);

  const toast = page.locator('[data-slot="toast"][data-type="error"]');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText(REFERENCE);
});

test("a refusal is a warning rather than an error", async ({ page }) => {
  await refuse(page, 409);
  await writeANote(page);

  const toast = page.locator('[data-slot="toast"][data-type="warning"]');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText("could not be saved");
});

test("the copy button puts the correlation id on the clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await refuse(page, 500);
  await writeANote(page);

  await page.locator('[data-slot="toast-action"]').click();

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(REFERENCE);
});

test("a note the API refuses is not silently cleared", async ({ page }) => {
  await refuse(page, 500);
  await writeANote(page);

  await expect(page.getByLabel("Note text")).not.toHaveValue("");
});

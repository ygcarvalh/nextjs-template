import { expect, test } from "@playwright/test";
import { ready } from "../support";

test("lists the correlation id of a request this run just made", async ({ page }) => {
  await page.goto("/notes");
  await page.goto("/requests");

  const rows = page.getByRole("row");
  await expect(rows.first()).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Correlation id" })).toBeVisible();
});

test("narrows the list to one outcome", async ({ page }) => {
  await page.goto("/requests?outcome=error");

  await expect(page.getByRole("combobox", { name: "Outcome" })).toContainText("Error");
});

test("filters as soon as an outcome is picked", async ({ page }) => {
  await page.goto("/requests");
  await ready(page);

  await page.getByRole("combobox", { name: "Outcome" }).click();
  await page.getByRole("option", { name: "Warning" }).click();

  await expect(page).toHaveURL(/outcome=warning/);
  await expect(page.getByRole("combobox", { name: "Outcome" })).toContainText("Warning");
});

test("says so when nothing matches", async ({ page }) => {
  await page.goto("/requests?request_id=definitely-not-a-real-id");

  await expect(page.getByText("Nothing matched")).toBeVisible();
});

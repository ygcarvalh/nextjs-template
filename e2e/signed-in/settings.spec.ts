import { expect, test } from "@playwright/test";
import { ready, submitUntil } from "../support";

test("saves a name and shows it again after a reload", async ({ page }) => {
  await page.goto("/settings");
  await ready(page);

  const name = `Ada ${test.info().testId.slice(0, 6)}`;
  const profile = page.locator("form").filter({ has: page.getByLabel("Name") });
  const save = profile.getByRole("button", { name: "Save" });
  // The button is disabled until this island hydrates, which makes it the signal
  // to wait on: these inputs are controlled, so a value typed before React took
  // over would be discarded, and a click would save the old one.
  await expect(save).toBeEnabled();
  await page.getByLabel("Name").fill(name);
  await save.click();
  await expect(profile.getByRole("status")).toContainText("Saved");

  await page.reload();
  await expect(page.getByLabel("Name")).toHaveValue(name);
});

test("refuses two new passwords that disagree", async ({ page }) => {
  await page.goto("/settings");
  await ready(page);

  const form = page.locator("form").filter({ has: page.getByLabel("Current password") });
  const change = form.getByRole("button", { name: "Change password" });
  await expect(change).toBeEnabled();
  await page.getByLabel("Current password").fill("whatever-it-is");
  await page.getByLabel("New password", { exact: true }).fill("a-long-enough-password");
  await page.getByLabel("Confirm new password").fill("a-different-password");
  await change.click();

  await expect(form.getByRole("alert")).toContainText("do not match");
});

test("remembers the toast reference setting across a reload", async ({ page }) => {
  await page.goto("/settings");
  await ready(page);
  const toggle = page.getByRole("switch", { name: /correlation id/i });
  const before = await toggle.getAttribute("aria-checked");

  await submitUntil(
    () => toggle.click(),
    () => expect(toggle).not.toHaveAttribute("aria-checked", before ?? "", { timeout: 6000 }),
  );

  await page.reload();
  await expect(page.getByRole("switch", { name: /correlation id/i })).not.toHaveAttribute(
    "aria-checked",
    before ?? "",
  );
});

test("switches the language and the whole screen follows", async ({ page }) => {
  await page.goto("/settings");
  await ready(page);

  await submitUntil(
    () => page.getByRole("button", { name: "Português" }).click(),
    () => expect(page.getByRole("heading", { name: "Ajustes" })).toBeVisible({ timeout: 6000 }),
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");

  await page.reload();
  await expect(page.getByRole("heading", { name: "Ajustes" })).toBeVisible();

  await submitUntil(
    () => page.getByRole("button", { name: "English" }).click(),
    () => expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 6000 }),
  );
});

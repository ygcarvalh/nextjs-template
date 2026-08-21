import { expect, test as setup } from "@playwright/test";
import { STORAGE_STATE, signIn } from "./support";

setup("signs in once for the signed-in suite", async ({ page }) => {
  await page.goto("/login");
  await signIn(page);

  await expect(page).toHaveURL("/notes");
  await page.context().storageState({ path: STORAGE_STATE });
});

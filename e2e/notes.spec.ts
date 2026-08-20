import { expect, test } from "@playwright/test";

const EMAIL = process.env.AUTH_DEMO_EMAIL ?? "demo@example.com";
const PASSWORD = process.env.AUTH_DEMO_PASSWORD ?? "demo-password";
const baseURL = `http://localhost:${process.env.E2E_PORT ?? 3100}`;

async function signIn(page: import("@playwright/test").Page) {
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("sends an anonymous visitor to sign in, then back to where they were going", async ({
  page,
}) => {
  await page.goto("/notes");

  await expect(page).toHaveURL("/login?next=%2Fnotes");

  await signIn(page);

  await expect(page).toHaveURL("/notes");
  await expect(page.getByText(EMAIL)).toBeVisible();
});

test("creates a note and shows it", async ({ page }) => {
  await page.goto("/login");
  await signIn(page);
  await expect(page).toHaveURL("/notes");

  const text = `note from the e2e run ${test.info().testId}`;
  await page.getByLabel("Note text").fill(text);
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText(text)).toBeVisible();

  await page.reload();
  await expect(page.getByText(text)).toBeVisible();
});

test("signing out closes access again", async ({ page }) => {
  await page.goto("/login");
  await signIn(page);
  await expect(page).toHaveURL("/notes");

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/notes");
  await expect(page).toHaveURL("/login?next=%2Fnotes");
});

test("rejects wrong credentials without leaving the page", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill("definitely-not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.locator("form").getByRole("alert")).toContainText("don't match an account");
  await expect(page).toHaveURL(/\/login/);
});

test("a hostile next parameter cannot redirect off-origin", async ({ page }) => {
  await page.goto("/login?next=//example.com/phish");

  await signIn(page);

  await expect(page).toHaveURL("/notes");
  expect(new URL(page.url()).host).toBe(new URL(baseURL).host);
});

test("an unknown URL returns a real 404", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-route");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /nothing at this address/i })).toBeVisible();
});

test("serves the security headers on a real response", async ({ page }) => {
  const response = await page.goto("/");
  const headers = response?.headers() ?? {};

  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers).not.toHaveProperty("x-powered-by");
});

test("every response carries a correlation id the browser can read", async ({ page }) => {
  const first = await page.goto("/");
  const second = await page.goto("/");

  const firstId = first?.headers()["x-request-id"];
  const secondId = second?.headers()["x-request-id"];

  expect(firstId).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
  expect(secondId).not.toBe(firstId);

  const cookie = (await page.context().cookies()).find((entry) => entry.name === "x-request-id");
  expect(cookie?.value).toBe(secondId);
});

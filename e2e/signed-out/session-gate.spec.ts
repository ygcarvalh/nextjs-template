import { expect, test } from "@playwright/test";
import { account, baseURL, signIn } from "../support";

test("sends an anonymous visitor to sign in, then back to where they were going", async ({
  page,
}) => {
  await page.goto("/notes");

  await expect(page).toHaveURL("/login?next=%2Fnotes");

  await signIn(page);

  await expect(page).toHaveURL("/notes");
});

test("gates a screen nobody remembered to name", async ({ page }) => {
  await page.goto("/requests");

  await expect(page).toHaveURL("/login?next=%2Frequests");
});

test("rejects wrong credentials without leaving the page", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(account().email);
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

test("bounces an unknown URL to sign in rather than answering it", async ({ page }) => {
  await page.goto("/definitely-not-a-route");

  await expect(page).toHaveURL("/login?next=%2Fdefinitely-not-a-route");
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

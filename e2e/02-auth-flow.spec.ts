import { test, expect } from "@playwright/test";
import { resetData, logout, PROFILES } from "./helpers";

test.describe("Authentication flow", () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
    await logout(page);
  });

  test("Login page shows mock login panel with all builders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Alex Chen")).toBeVisible();
    await expect(page.getByText("Maya Rodriguez")).toBeVisible();
    await expect(page.getByText("Sam Nakamura")).toBeVisible();
    await expect(page.getByText("Riley Patel")).toBeVisible();
    await expect(page.getByText("Jordan Lee")).toBeVisible();
  });

  test("Click mock user logs in and redirects to home", async ({ page }) => {
    await page.goto("/login");
    await page.getByText(PROFILES.admin.name).click();
    await page.waitForURL("/");
    await expect(page.getByText(PROFILES.admin.name).first()).toBeVisible();
  });

  test("Login with redirect preserves ?next param", async ({ page }) => {
    await page.goto("/login?next=%2Fsubmit");
    await page.getByText(PROFILES.riley.name).click();
    await page.waitForURL("/submit");
  });

  test("Already logged in user visiting /login gets redirected", async ({ page }) => {
    await page.request.post("/api/dev/login", { data: { profileId: PROFILES.admin.id } });
    await page.goto("/login");
    await page.waitForURL("/");
  });

  test("Sign out works via API", async ({ page }) => {
    // Login
    await page.request.post("/api/dev/login", { data: { profileId: PROFILES.admin.id } });
    await page.goto("/");
    await expect(page.getByText(PROFILES.admin.name).first()).toBeVisible();
    // Logout via API
    await page.request.post("/api/dev/logout");
    // Visit vote page — should show sign-in
    await page.goto("/vote");
    await expect(page.getByText(/sign in/i).first()).toBeVisible();
  });

  test("Non-admin user cannot access admin pages", async ({ page }) => {
    await page.request.post("/api/dev/login", { data: { profileId: PROFILES.riley.id } });
    await page.goto("/admin/weeks");
    // Non-admin redirects to / (home), not /login
    await page.waitForURL("/");
  });

  test("Admin user can access admin pages", async ({ page }) => {
    await page.request.post("/api/dev/login", { data: { profileId: PROFILES.admin.id } });
    await page.goto("/admin/weeks");
    await expect(page.getByText(/all weeks/i).first()).toBeVisible();
  });
});

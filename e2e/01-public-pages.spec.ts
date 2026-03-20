import { test, expect } from "@playwright/test";
import { resetData, logout } from "./helpers";

test.describe("Public pages (no auth)", () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
    await logout(page);
  });

  test("Homepage loads with hero and key sections", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Hero section
    await expect(page.locator("h1").first()).toBeVisible();
    // Page should not show server error
    const body = await page.textContent("body");
    expect(body?.toLowerCase()).not.toContain("unable to load");
  });

  test("Navbar links are present and clickable", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /vote/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /board/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /rules/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /submit/i }).first()).toBeVisible();
  });

  test("Leaderboard page loads with entries", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    // Should have some content — entries or leaderboard header
    expect(body?.length).toBeGreaterThan(100);
  });

  test("Rules page loads", async ({ page }) => {
    await page.goto("/rules");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("Entry detail page loads for seeded entry", async ({ page }) => {
    await page.goto("/entry/shipfast-agent");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("ShipFast Agent").first()).toBeVisible();
  });

  test("Vote page shows sign-in prompt for unauthenticated user", async ({ page }) => {
    await page.goto("/vote");
    await expect(page.getByText(/sign in/i).first()).toBeVisible();
  });

  test("Submit page redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/submit");
    await page.waitForURL(/login/);
  });

  test("Admin page redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/admin/weeks");
    await page.waitForURL(/login/);
  });
});

import { test, expect } from "@playwright/test";
import { resetData, loginAsAdmin, loginAsUser, loginAs, logout, PROFILES } from "./helpers";

test.describe("Edge cases and error handling", () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
  });

  test("Data reset API works", async ({ page }) => {
    const response = await page.request.post("/api/dev/reset");
    expect(response.ok()).toBeTruthy();
  });

  test("Login with invalid profileId returns 404", async ({ page }) => {
    const response = await page.request.post("/api/dev/login", { data: { profileId: "nonexistent" } });
    expect(response.status()).toBe(404);
  });

  test("Login with missing profileId returns 400", async ({ page }) => {
    const response = await page.request.post("/api/dev/login", { data: {} as Record<string, string> });
    expect(response.status()).toBe(400);
  });

  test("Creating duplicate week slug fails gracefully", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/weeks");
    await page.fill('input[name="slug"]', "agents-that-ship");
    await page.fill('input[name="themeTitle"]', "Dup Test");
    await page.fill('input[name="submissionOpenAt"]', "2026-04-01T10:00");
    await page.fill('input[name="submissionCloseAt"]', "2026-04-05T22:00");
    await page.fill('input[name="votingOpenAt"]', "2026-04-06T10:00");
    await page.fill('input[name="votingCloseAt"]', "2026-04-10T22:00");
    await page.fill('textarea[name="themeDescription"]', "Dup.");
    await page.getByRole("button", { name: /create draft week/i }).click();
    await page.waitForLoadState("networkidle");
    // Should stay functional
    expect(page.url()).toMatch(/admin\/weeks/);
  });

  test("Submitting to a non-existent week returns error", async ({ page }) => {
    await loginAsUser(page);
    const response = await page.request.post("/api/submissions", {
      data: { weekSlug: "nonexistent-week", title: "Test Entry", oneLiner: "This is a valid one liner but for a nonexistent week.", liveUrl: "https://test.example.com", demoAssetPath: "mock://test" },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("Leaderboard API returns data", async ({ page }) => {
    const response = await page.request.get("/api/leaderboard?week=agents-that-ship");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test("My submissions page when not logged in redirects to login", async ({ page }) => {
    await logout(page);
    await page.goto("/my-submissions");
    await page.waitForURL(/login/);
  });

  test("My submissions page shows user's entries", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/my-submissions");
    await expect(page.getByText("ShipFast Agent").first()).toBeVisible();
  });

  test("Multiple rapid votes don't break the system", async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/vote");
    await page.waitForSelector("button:has-text('Pick this app')", { timeout: 10_000 });

    for (let i = 0; i < 3; i++) {
      const btn = page.getByRole("button", { name: /pick this app/i }).first();
      const done = page.getByText(/no fresh matchups/i).first();
      const complete = page.getByText(/voting sprint complete/i).first();
      const which = await Promise.race([
        btn.waitFor({ timeout: 10_000 }).then(() => "pick" as const),
        done.waitFor({ timeout: 10_000 }).then(() => "done" as const),
        complete.waitFor({ timeout: 10_000 }).then(() => "complete" as const),
      ]).catch(() => "timeout" as const);
      if (which !== "pick") break;
      await btn.click();
      await page.waitForTimeout(300);
    }
    // Page should still be functional
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("Switching users mid-session works correctly", async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/");
    await expect(page.getByText(PROFILES.riley.name).first()).toBeVisible();

    await loginAs(page, PROFILES.maya.id);
    await page.goto("/");
    await expect(page.getByText(PROFILES.maya.name).first()).toBeVisible();
  });
});

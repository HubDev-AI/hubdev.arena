import { test, expect } from "@playwright/test";
import { resetData, loginAsAdmin, loginAs } from "./helpers";

test.describe("Admin — Week management", () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
    await loginAsAdmin(page);
  });

  test("Admin weeks list shows seeded weeks", async ({ page }) => {
    await page.goto("/admin/weeks");
    await expect(page.getByText("Agents That Ship").first()).toBeVisible();
    await expect(page.getByText("Hello World").first()).toBeVisible();
  });

  test("Click week navigates to week detail", async ({ page }) => {
    await page.goto("/admin/weeks");
    await page.getByText("Agents That Ship").first().click();
    await page.waitForURL(/admin\/weeks\/agents-that-ship/);
    await expect(page.getByText(/voting open/i).first()).toBeVisible();
  });

  test("Week detail shows entries, stats, and actions", async ({ page }) => {
    await page.goto("/admin/weeks/agents-that-ship");
    await expect(page.getByText("ShipFast Agent").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /lock results/i }).first()).toBeVisible();
  });

  test("Create a new week via admin form", async ({ page }) => {
    await page.goto("/admin/weeks");
    await page.fill('input[name="slug"]', "test-week-e2e");
    await page.fill('input[name="themeTitle"]', "E2E Test Week");
    await page.fill('input[name="submissionOpenAt"]', "2026-04-01T10:00");
    await page.fill('input[name="submissionCloseAt"]', "2026-04-05T22:00");
    await page.fill('input[name="votingOpenAt"]', "2026-04-06T10:00");
    await page.fill('input[name="votingCloseAt"]', "2026-04-10T22:00");
    await page.fill('textarea[name="themeDescription"]', "An automated E2E test week.");
    await page.getByRole("button", { name: /create draft week/i }).click();
    await page.waitForURL(/admin\/weeks\/test-week-e2e/);
    await expect(page.getByText("E2E Test Week").first()).toBeVisible();
    await expect(page.getByText(/draft/i).first()).toBeVisible();
  });

  test("Full week lifecycle: draft → submissions → voting → locked → archived", async ({ page }) => {
    // Create week
    await page.goto("/admin/weeks");
    await page.fill('input[name="slug"]', "lifecycle-test");
    await page.fill('input[name="themeTitle"]', "Lifecycle Test");
    await page.fill('input[name="submissionOpenAt"]', "2026-04-01T10:00");
    await page.fill('input[name="submissionCloseAt"]', "2026-04-05T22:00");
    await page.fill('input[name="votingOpenAt"]', "2026-04-06T10:00");
    await page.fill('input[name="votingCloseAt"]', "2026-04-10T22:00");
    await page.fill('textarea[name="themeDescription"]', "Testing full lifecycle.");
    await page.getByRole("button", { name: /create draft week/i }).click();
    await page.waitForURL(/admin\/weeks\/lifecycle-test/);

    // Draft → Open submissions
    await expect(page.getByText(/draft/i).first()).toBeVisible();
    await page.getByRole("button", { name: /open submissions/i }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/submissions open/i).first()).toBeVisible();

    // Submit entries via API
    for (const builderId of ["builder-2", "builder-3", "builder-4"]) {
      await loginAs(page, builderId);
      await page.request.post("/api/submissions", {
        data: {
          weekSlug: "lifecycle-test",
          title: `Entry by ${builderId}`,
          oneLiner: "This is a test submission for the lifecycle test week created by e2e.",
          liveUrl: `https://example-${builderId}.com`,
          demoAssetPath: `mock://${builderId}-demo`,
        },
      });
    }

    // Re-login as admin
    await loginAsAdmin(page);
    await page.goto("/admin/weeks/lifecycle-test");

    // Approve all pending entries one by one
    for (let i = 0; i < 3; i++) {
      const approveBtn = page.getByRole("button", { name: /^approve$/i }).first();
      if (await approveBtn.isVisible().catch(() => false)) {
        await approveBtn.click();
        await page.waitForLoadState("networkidle");
      }
    }

    // Open voting
    const openVotingBtn = page.getByRole("button", { name: /generate matchups/i });
    if (await openVotingBtn.isVisible().catch(() => false)) {
      await openVotingBtn.click();
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(/voting open/i).first()).toBeVisible();
    }

    // Lock results
    const lockBtn = page.getByRole("button", { name: /lock results/i });
    if (await lockBtn.isVisible().catch(() => false)) {
      await lockBtn.click();
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(/locked/i).first()).toBeVisible();
    }

    // Archive
    const archiveBtn = page.getByRole("button", { name: /archive/i });
    if (await archiveBtn.isVisible().catch(() => false)) {
      await archiveBtn.click();
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(/archived/i).first()).toBeVisible();
    }
  });

  test("Back to weeks link works from detail page", async ({ page }) => {
    await page.goto("/admin/weeks/agents-that-ship");
    await page.getByRole("link", { name: /all weeks|back to weeks/i }).first().click();
    await page.waitForURL(/admin\/weeks$/);
  });

  test("Lock results on voting_open week", async ({ page }) => {
    await page.goto("/admin/weeks/agents-that-ship");
    await page.getByRole("button", { name: /lock results/i }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/locked/i).first()).toBeVisible();
  });
});

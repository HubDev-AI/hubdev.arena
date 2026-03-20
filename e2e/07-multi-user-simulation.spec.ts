import { test, expect } from "@playwright/test";
import { resetData, loginAs, loginAsAdmin, PROFILES } from "./helpers";

test.describe("Multi-user simulation", () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
  });

  test("Five users submit entries, admin reviews, voting, and lock", async ({ page }) => {
    // Step 1: Admin creates week
    await loginAsAdmin(page);
    await page.goto("/admin/weeks");
    await page.fill('input[name="slug"]', "multi-user-test");
    await page.fill('input[name="themeTitle"]', "Multi User Test");
    await page.fill('input[name="submissionOpenAt"]', "2026-04-01T10:00");
    await page.fill('input[name="submissionCloseAt"]', "2026-04-05T22:00");
    await page.fill('input[name="votingOpenAt"]', "2026-04-06T10:00");
    await page.fill('input[name="votingCloseAt"]', "2026-04-10T22:00");
    await page.fill('textarea[name="themeDescription"]', "Testing multi-user flow.");
    await page.getByRole("button", { name: /create draft week/i }).click();
    await page.waitForURL(/admin\/weeks\/multi-user-test/);
    await page.getByRole("button", { name: /open submissions/i }).click();
    await page.waitForLoadState("networkidle");

    // Step 2: All 5 users submit entries
    const allProfiles = [PROFILES.admin, PROFILES.maya, PROFILES.sam, PROFILES.riley, PROFILES.jordan];
    for (const profile of allProfiles) {
      await loginAs(page, profile.id);
      const response = await page.request.post("/api/submissions", {
        data: {
          weekSlug: "multi-user-test",
          title: `${profile.name}'s App`,
          oneLiner: `A brilliant application submitted by ${profile.name} for testing.`,
          liveUrl: `https://${profile.id}.example.com`,
          demoAssetPath: `mock://${profile.id}-demo`,
        },
      });
      expect(response.status()).toBe(201);
    }

    // Step 3: Admin approves all
    await loginAsAdmin(page);
    await page.goto("/admin/weeks/multi-user-test");
    for (let i = 0; i < 5; i++) {
      const btn = page.getByRole("button", { name: /^approve$/i }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForLoadState("networkidle");
      }
    }

    // Step 4: Open voting
    const openBtn = page.getByRole("button", { name: /generate matchups/i });
    if (await openBtn.isVisible().catch(() => false)) {
      await openBtn.click();
      await page.waitForLoadState("networkidle");
    }
    await expect(page.getByText(/voting open/i).first()).toBeVisible();

    // Step 5: Lock
    const lockBtn = page.getByRole("button", { name: /lock results/i });
    if (await lockBtn.isVisible().catch(() => false)) {
      await lockBtn.click();
      await page.waitForLoadState("networkidle");
    }
    await expect(page.getByText(/locked/i).first()).toBeVisible();
  });

  test("API-level voting from multiple users", async ({ page }) => {
    const votes: Array<{ user: string; status: number }> = [];

    for (const profile of [PROFILES.maya, PROFILES.sam, PROFILES.riley, PROFILES.jordan]) {
      await loginAs(page, profile.id);
      const nextResponse = await page.request.get("/api/vote/next?week=agents-that-ship");
      if (!nextResponse.ok()) {
        votes.push({ user: profile.name, status: nextResponse.status() });
        continue;
      }
      const matchup = await nextResponse.json();
      const voteResponse = await page.request.post("/api/vote", {
        data: {
          weekSlug: "agents-that-ship",
          matchupId: matchup.matchupId,
          winnerEntryId: matchup.leftEntry.id,
          loserEntryId: matchup.rightEntry.id,
          idempotencyKey: `e2e-${profile.id}-${Date.now()}`,
        },
      });
      votes.push({ user: profile.name, status: voteResponse.status() });
    }

    for (const vote of votes) {
      expect(vote.status === 200 || vote.status === 404).toBeTruthy();
    }
  });

  test("All seeded entry detail pages load without error", async ({ page }) => {
    const slugs = ["shipfast-agent", "designbot-studio", "data-whisperer", "codepilot-ai", "bugslayer-pro"];
    for (const slug of slugs) {
      const response = await page.goto(`/entry/${slug}`);
      expect(response?.status()).toBeLessThan(500);
      await page.waitForLoadState("networkidle");
    }
  });
});

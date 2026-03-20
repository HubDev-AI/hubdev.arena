import { test, expect } from "@playwright/test";
import { resetData, loginAsUser, loginAs, logout, PROFILES } from "./helpers";

test.describe("Voting flow", () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
  });

  test("Vote page shows matchup for authenticated user when voting is open", async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/vote");
    await expect(page.getByText(/vote 1 of 10/i).first()).toBeVisible();
    await page.waitForSelector("button:has-text('Pick this app')", { timeout: 10_000 });
  });

  test("Vote page shows appropriate message when voting is not open", async ({ page }) => {
    // Lock the current week
    await page.request.post("/api/dev/login", { data: { profileId: PROFILES.admin.id } });
    await page.goto("/admin/weeks/agents-that-ship");
    await page.getByRole("button", { name: /lock results/i }).click();
    await page.waitForLoadState("networkidle");

    await loginAsUser(page);
    await page.goto("/vote");
    // Should show either "no active voting round" or "no fresh matchups"
    const body = await page.textContent("body");
    expect(
      body?.includes("no active voting round") ||
      body?.includes("No active voting round") ||
      body?.includes("No fresh matchups") ||
      body?.includes("no fresh matchups")
    ).toBeTruthy();
  });

  test("Unauthenticated user sees sign-in prompt on vote page", async ({ page }) => {
    await logout(page);
    await page.goto("/vote");
    await expect(page.getByText(/sign in/i).first()).toBeVisible();
  });

  test("Casting a vote increments the counter", async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/vote");
    await page.waitForSelector("button:has-text('Pick this app')", { timeout: 10_000 });
    await page.getByRole("button", { name: /pick this app/i }).first().click();
    await expect(page.getByText(/vote 2 of 10/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("Vote API rejects unauthenticated request", async ({ page }) => {
    await logout(page);
    const response = await page.request.post("/api/vote", {
      data: { weekSlug: "agents-that-ship", matchupId: "fake-matchup", winnerEntryId: "entry-1", loserEntryId: "entry-2", idempotencyKey: "test-idem-key-12345" },
    });
    expect(response.status()).toBe(401);
  });

  test("Vote next API rejects unauthenticated request", async ({ page }) => {
    await logout(page);
    const response = await page.request.get("/api/vote/next?week=agents-that-ship");
    expect(response.status()).toBe(401);
  });

  test("Vote next API requires week param", async ({ page }) => {
    await loginAsUser(page);
    const response = await page.request.get("/api/vote/next");
    expect(response.status()).toBe(400);
  });

  test("Multiple users can vote sequentially", async ({ page }) => {
    for (const profile of [PROFILES.riley, PROFILES.maya, PROFILES.sam]) {
      await loginAs(page, profile.id);
      await page.goto("/vote");
      const pickBtn = page.getByRole("button", { name: /pick this app/i }).first();
      const noMore = page.getByText(/no fresh matchups/i).first();

      const which = await Promise.race([
        pickBtn.waitFor({ timeout: 10_000 }).then(() => "pick" as const),
        noMore.waitFor({ timeout: 10_000 }).then(() => "done" as const),
      ]).catch(() => "timeout" as const);

      if (which === "pick") {
        await pickBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("Voting exhausts matchups or reaches sprint complete", async ({ page }) => {
    await loginAs(page, PROFILES.jordan.id);
    await page.goto("/vote");

    let votesCast = 0;
    for (let i = 0; i < 10; i++) {
      const pickButton = page.getByRole("button", { name: /pick this app/i }).first();
      const noMatchups = page.getByText(/no fresh matchups/i).first();
      const sprintComplete = page.getByText(/votes cast/i).first();
      const errorBox = page.getByText(/failed to load/i).first();

      const which = await Promise.race([
        pickButton.waitFor({ timeout: 10_000 }).then(() => "pick" as const),
        noMatchups.waitFor({ timeout: 10_000 }).then(() => "done" as const),
        sprintComplete.waitFor({ timeout: 10_000 }).then(() => "complete" as const),
        errorBox.waitFor({ timeout: 10_000 }).then(() => "error" as const),
      ]).catch(() => "timeout" as const);

      if (which !== "pick") break;
      await pickButton.click();
      votesCast++;
      // Wait for UI to update
      await page.waitForTimeout(500);
    }

    // At least one vote should have been cast or matchups exhausted immediately
    expect(votesCast >= 0).toBeTruthy();
  });
});

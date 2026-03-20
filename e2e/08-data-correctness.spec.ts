import { test, expect } from "@playwright/test";
import { resetData, loginAs, loginAsAdmin, PROFILES } from "./helpers";

test.describe("Data correctness — ELO, leaderboard, counts", () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
  });

  test("Leaderboard API returns correct initial seed data", async ({ page }) => {
    const response = await page.request.get("/api/leaderboard?week=agents-that-ship");
    expect(response.ok()).toBeTruthy();
    const data = (await response.json()) as Array<{
      entrySlug: string;
      title: string;
      elo: number;
      wins: number;
      losses: number;
      builderName: string;
      rank: number;
    }>;

    // Should have 5 seeded entries
    expect(data.length).toBe(5);

    // Entries should be sorted by ELO descending (rank ascending)
    for (let i = 1; i < data.length; i++) {
      expect(data[i - 1]!.elo).toBeGreaterThanOrEqual(data[i]!.elo);
    }

    // Verify known seed values
    const shipfast = data.find((e) => e.title === "ShipFast Agent");
    expect(shipfast).toBeTruthy();
    expect(shipfast!.elo).toBe(1243);
    expect(shipfast!.wins).toBe(28);
    expect(shipfast!.losses).toBe(21);
    expect(shipfast!.builderName).toBe("Alex Chen");
    expect(shipfast!.rank).toBe(1);

    const designbot = data.find((e) => e.title === "DesignBot Studio");
    expect(designbot).toBeTruthy();
    expect(designbot!.elo).toBe(1210);
    expect(designbot!.builderName).toBe("Maya Rodriguez");
  });

  test("ELO updates correctly after a vote", async ({ page }) => {
    // Get initial leaderboard
    const initialResponse = await page.request.get("/api/leaderboard?week=agents-that-ship");
    const initialData = (await initialResponse.json()) as Array<{
      entrySlug: string;
      title: string;
      elo: number;
      wins: number;
      losses: number;
    }>;

    // Cast a vote
    await loginAs(page, PROFILES.riley.id);
    const nextResponse = await page.request.get("/api/vote/next?week=agents-that-ship");
    expect(nextResponse.ok()).toBeTruthy();
    const matchup = (await nextResponse.json()) as {
      matchupId: string;
      leftEntry: { id: string; title: string };
      rightEntry: { id: string; title: string };
    };

    const winnerId = matchup.leftEntry.id;
    const loserId = matchup.rightEntry.id;

    // Find initial values by matching entry IDs through title
    const winnerTitle = matchup.leftEntry.title;
    const loserTitle = matchup.rightEntry.title;

    const voteResponse = await page.request.post("/api/vote", {
      data: {
        weekSlug: "agents-that-ship",
        matchupId: matchup.matchupId,
        winnerEntryId: winnerId,
        loserEntryId: loserId,
        idempotencyKey: `elo-test-${Date.now()}-abcdef`,
      },
    });
    expect(voteResponse.ok()).toBeTruthy();

    // Get updated leaderboard
    const updatedResponse = await page.request.get("/api/leaderboard?week=agents-that-ship");
    const updatedData = (await updatedResponse.json()) as Array<{
      title: string;
      elo: number;
      wins: number;
      losses: number;
    }>;

    const initialWinner = initialData.find((e) => e.title === winnerTitle)!;
    const updatedWinner = updatedData.find((e) => e.title === winnerTitle)!;
    const initialLoser = initialData.find((e) => e.title === loserTitle)!;
    const updatedLoser = updatedData.find((e) => e.title === loserTitle)!;

    // Winner should gain ELO and a win
    expect(updatedWinner.elo).toBeGreaterThan(initialWinner.elo);
    expect(updatedWinner.wins).toBe(initialWinner.wins + 1);

    // Loser should lose ELO and gain a loss
    expect(updatedLoser.elo).toBeLessThan(initialLoser.elo);
    expect(updatedLoser.losses).toBe(initialLoser.losses + 1);

    // ELO should be zero-sum
    const eloGain = updatedWinner.elo - initialWinner.elo;
    const eloLoss = initialLoser.elo - updatedLoser.elo;
    expect(eloGain).toBe(eloLoss);
  });

  test("Leaderboard page shows all entries from API", async ({ page }) => {
    const apiResponse = await page.request.get("/api/leaderboard?week=agents-that-ship");
    const apiData = (await apiResponse.json()) as Array<{ title: string }>;

    await page.goto("/leaderboard");
    await page.waitForLoadState("networkidle");

    for (const entry of apiData) {
      await expect(page.getByText(entry.title).first()).toBeVisible();
    }
  });

  test("Admin stats counts match entry data", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/weeks/agents-that-ship");
    await page.waitForLoadState("networkidle");

    // Use more specific selectors — target the stats cards by their structure
    const statsSection = page.locator(".grid.gap-3");
    const entriesCard = statsSection.locator("div").filter({ hasText: /^Entries/ });
    const approvedCard = statsSection.locator("div").filter({ hasText: /^Approved/ });
    const pendingCard = statsSection.locator("div").filter({ hasText: /^Pending/ });

    await expect(entriesCard.getByText("5")).toBeVisible();
    await expect(approvedCard.getByText("5")).toBeVisible();
    await expect(pendingCard.getByText("0")).toBeVisible();
  });

  test("Vote count is zero-sum across all entries", async ({ page }) => {
    // Cast 3 votes
    await loginAs(page, PROFILES.maya.id);
    for (let i = 0; i < 3; i++) {
      const nextResponse = await page.request.get("/api/vote/next?week=agents-that-ship");
      if (!nextResponse.ok()) break;
      const matchup = await nextResponse.json();
      await page.request.post("/api/vote", {
        data: {
          weekSlug: "agents-that-ship",
          matchupId: matchup.matchupId,
          winnerEntryId: matchup.leftEntry.id,
          loserEntryId: matchup.rightEntry.id,
          idempotencyKey: `zerosum-${i}-${Date.now()}-abcdef`,
        },
      });
    }

    const response = await page.request.get("/api/leaderboard?week=agents-that-ship");
    const data = (await response.json()) as Array<{ wins: number; losses: number }>;

    const totalWins = data.reduce((sum, e) => sum + e.wins, 0);
    const totalLosses = data.reduce((sum, e) => sum + e.losses, 0);
    expect(totalWins).toBe(totalLosses);
  });

  test("New submission appears with correct data in admin", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/weeks");
    await page.fill('input[name="slug"]', "data-check");
    await page.fill('input[name="themeTitle"]', "Data Check");
    await page.fill('input[name="submissionOpenAt"]', "2026-04-01T10:00");
    await page.fill('input[name="submissionCloseAt"]', "2026-04-05T22:00");
    await page.fill('input[name="votingOpenAt"]', "2026-04-06T10:00");
    await page.fill('input[name="votingCloseAt"]', "2026-04-10T22:00");
    await page.fill('textarea[name="themeDescription"]', "Data correctness test.");
    await page.getByRole("button", { name: /create draft week/i }).click();
    await page.waitForURL(/admin\/weeks\/data-check/);
    await page.getByRole("button", { name: /open submissions/i }).click();
    await page.waitForLoadState("networkidle");

    await loginAs(page, PROFILES.riley.id);
    await page.request.post("/api/submissions", {
      data: {
        weekSlug: "data-check",
        title: "Exact Title Check",
        oneLiner: "This one-liner should appear exactly as typed in the admin panel.",
        liveUrl: "https://exact-check.example.com",
        demoAssetPath: "mock://exact-check",
      },
    });

    await loginAsAdmin(page);
    await page.goto("/admin/weeks/data-check");
    await expect(page.getByText("Exact Title Check").first()).toBeVisible();
    await expect(page.getByText("This one-liner should appear exactly as typed").first()).toBeVisible();
    await expect(page.getByText(/pending/i).first()).toBeVisible();
  });

  test("My-submissions shows only current user's entries", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/my-submissions");
    await expect(page.getByText("ShipFast Agent").first()).toBeVisible();

    await loginAs(page, PROFILES.jordan.id);
    await page.goto("/my-submissions");
    const body = await page.textContent("body");
    expect(body?.includes("ShipFast Agent")).toBeFalsy();
  });
});

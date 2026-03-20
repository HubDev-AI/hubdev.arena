import { test, expect } from "@playwright/test";
import { resetData, loginAsAdmin, loginAsUser, loginAs, logout, PROFILES } from "./helpers";

test.describe("Submissions flow", () => {
  test.beforeEach(async ({ page }) => {
    await resetData(page);
  });

  test("Submit page shows 'no open week' when no submissions_open week", async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/submit");
    await expect(page.getByText(/no week.*open.*submission/i).first()).toBeVisible();
  });

  test("Submit page shows form when a week has submissions_open", async ({ page }) => {
    // Create and open week
    await loginAsAdmin(page);
    await page.goto("/admin/weeks");
    await page.fill('input[name="slug"]', "sub-test");
    await page.fill('input[name="themeTitle"]', "Submission Test");
    await page.fill('input[name="submissionOpenAt"]', "2026-04-01T10:00");
    await page.fill('input[name="submissionCloseAt"]', "2026-04-05T22:00");
    await page.fill('input[name="votingOpenAt"]', "2026-04-06T10:00");
    await page.fill('input[name="votingCloseAt"]', "2026-04-10T22:00");
    await page.fill('textarea[name="themeDescription"]', "Test submissions.");
    await page.getByRole("button", { name: /create draft week/i }).click();
    await page.waitForURL(/admin\/weeks\/sub-test/);
    await page.getByRole("button", { name: /open submissions/i }).click();
    await page.waitForLoadState("networkidle");

    await loginAsUser(page);
    await page.goto("/submit");
    await expect(page.getByText("Submission Test").first()).toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();
  });

  test("Submission via API works and appears in my-submissions", async ({ page }) => {
    // Create week + open
    await loginAsAdmin(page);
    await page.goto("/admin/weeks");
    await page.fill('input[name="slug"]', "api-sub-test");
    await page.fill('input[name="themeTitle"]', "API Sub Test");
    await page.fill('input[name="submissionOpenAt"]', "2026-04-01T10:00");
    await page.fill('input[name="submissionCloseAt"]', "2026-04-05T22:00");
    await page.fill('input[name="votingOpenAt"]', "2026-04-06T10:00");
    await page.fill('input[name="votingCloseAt"]', "2026-04-10T22:00");
    await page.fill('textarea[name="themeDescription"]', "Test API submission.");
    await page.getByRole("button", { name: /create draft week/i }).click();
    await page.waitForURL(/admin\/weeks\/api-sub-test/);
    await page.getByRole("button", { name: /open submissions/i }).click();
    await page.waitForLoadState("networkidle");

    await loginAsUser(page);
    const response = await page.request.post("/api/submissions", {
      data: {
        weekSlug: "api-sub-test",
        title: "Riley Test App",
        oneLiner: "A great test app built entirely by automated tests for validation.",
        liveUrl: "https://riley-test-app.example.com",
        demoAssetPath: "mock://riley-test",
      },
    });
    expect(response.status()).toBe(201);

    await page.goto("/my-submissions");
    await expect(page.getByText("Riley Test App").first()).toBeVisible();
  });

  test("Submission API rejects invalid data", async ({ page }) => {
    await loginAsUser(page);

    // Missing/empty title
    const r1 = await page.request.post("/api/submissions", {
      data: { weekSlug: "agents-that-ship", title: "", oneLiner: "Valid one liner that is long enough for validation.", liveUrl: "https://test.com", demoAssetPath: "mock://test" },
    });
    expect(r1.status()).toBe(400);

    // Non-HTTPS URL
    const r2 = await page.request.post("/api/submissions", {
      data: { weekSlug: "agents-that-ship", title: "Good Title", oneLiner: "Valid one liner that is long enough for validation.", liveUrl: "http://insecure.com", demoAssetPath: "mock://test" },
    });
    expect(r2.status()).toBe(400);

    // Too short one-liner
    const r3 = await page.request.post("/api/submissions", {
      data: { weekSlug: "agents-that-ship", title: "Good Title", oneLiner: "Short", liveUrl: "https://test.com", demoAssetPath: "mock://test" },
    });
    expect(r3.status()).toBe(400);
  });

  test("Unauthenticated submission API returns 401", async ({ page }) => {
    await logout(page);
    const response = await page.request.post("/api/submissions", {
      data: { weekSlug: "agents-that-ship", title: "Unauth Test", oneLiner: "This should fail because we are not logged in at all.", liveUrl: "https://test.com", demoAssetPath: "mock://test" },
    });
    expect(response.status()).toBe(401);
  });

  test("Admin can approve and reject entries", async ({ page }) => {
    // Create week + open submissions
    await loginAsAdmin(page);
    await page.goto("/admin/weeks");
    await page.fill('input[name="slug"]', "review-test");
    await page.fill('input[name="themeTitle"]', "Review Test");
    await page.fill('input[name="submissionOpenAt"]', "2026-04-01T10:00");
    await page.fill('input[name="submissionCloseAt"]', "2026-04-05T22:00");
    await page.fill('input[name="votingOpenAt"]', "2026-04-06T10:00");
    await page.fill('input[name="votingCloseAt"]', "2026-04-10T22:00");
    await page.fill('textarea[name="themeDescription"]', "Test review.");
    await page.getByRole("button", { name: /create draft week/i }).click();
    await page.waitForURL(/admin\/weeks\/review-test/);
    await page.getByRole("button", { name: /open submissions/i }).click();
    await page.waitForLoadState("networkidle");

    // Submit entries
    await loginAs(page, PROFILES.maya.id);
    await page.request.post("/api/submissions", {
      data: { weekSlug: "review-test", title: "Maya App", oneLiner: "Maya's test application for review testing purposes.", liveUrl: "https://maya.example.com", demoAssetPath: "mock://maya" },
    });
    await loginAs(page, PROFILES.sam.id);
    await page.request.post("/api/submissions", {
      data: { weekSlug: "review-test", title: "Sam App", oneLiner: "Sam's test application for review testing purposes here.", liveUrl: "https://sam.example.com", demoAssetPath: "mock://sam" },
    });

    // Admin reviews
    await loginAsAdmin(page);
    await page.goto("/admin/weeks/review-test");
    await expect(page.getByText("Maya App").first()).toBeVisible();
    await expect(page.getByText("Sam App").first()).toBeVisible();

    // Approve first entry
    await page.getByRole("button", { name: /^approve$/i }).first().click();
    await page.waitForLoadState("networkidle");

    // Reject second entry
    await page.getByRole("button", { name: /^reject$/i }).first().click();
    await page.waitForLoadState("networkidle");

    // Verify states
    await expect(page.getByText(/approved/i).first()).toBeVisible();
    await expect(page.getByText(/rejected/i).first()).toBeVisible();
  });
});

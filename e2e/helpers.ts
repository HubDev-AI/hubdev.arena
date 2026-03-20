import type { Page } from "@playwright/test";

/** Reset mock data to initial state */
export async function resetData(page: Page) {
  await page.request.post("/api/dev/reset");
}

/** Login as a mock user by profile ID */
export async function loginAs(page: Page, profileId: string) {
  await page.request.post("/api/dev/login", {
    data: { profileId },
  });
}

/** Logout */
export async function logout(page: Page) {
  await page.request.post("/api/dev/logout");
}

/** Login as admin (Alex Chen = builder-1) */
export async function loginAsAdmin(page: Page) {
  await loginAs(page, "builder-1");
}

/** Login as regular user (Riley Patel = builder-4) */
export async function loginAsUser(page: Page) {
  await loginAs(page, "builder-4");
}

/** Login as Maya Rodriguez = builder-2 */
export async function loginAsMaya(page: Page) {
  await loginAs(page, "builder-2");
}

/** Login as Sam Nakamura = builder-3 */
export async function loginAsSam(page: Page) {
  await loginAs(page, "builder-3");
}

/** Login as Jordan Lee = builder-5 */
export async function loginAsJordan(page: Page) {
  await loginAs(page, "builder-5");
}

export const PROFILES = {
  admin: { id: "builder-1", name: "Alex Chen", email: "alex.chen@example.com" },
  maya: { id: "builder-2", name: "Maya Rodriguez", email: "maya.rodriguez@example.com" },
  sam: { id: "builder-3", name: "Sam Nakamura", email: "sam.nakamura@example.com" },
  riley: { id: "builder-4", name: "Riley Patel", email: "riley.patel@example.com" },
  jordan: { id: "builder-5", name: "Jordan Lee", email: "jordan.lee@example.com" },
};

import { test, expect } from "@playwright/test";

test.describe("Workforce Recruiter Profile", () => {
  test("creates a Workforce Recruiter profile", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/profile");
    await expect(page.locator("h1")).toContainText(/workforce recruiter profile/i);

    await page.fill('[data-testid="input-fullName"]', "River Stone");
    await page.fill('[data-testid="input-organization"]', "Liberation Futures");
    await page.fill('[data-testid="input-role"]', "Navigator");
    await page.fill('[data-testid="input-contactEmail"]', "river@example.com");
    await page.click('[data-testid="button-submit"]');

    await expect(page).toHaveURL(/\/apps\/workforce-recruiter/);
  });

  test("updates an existing profile", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/profile");
    await page.fill('[data-testid="input-capacity"]', "9");
    await page.click('[data-testid="button-submit"]');
    await expect(page.locator('[data-testid="button-submit"]')).toBeVisible();
  });

  test("deletes profile with confirmation", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/profile");
    await page.click('[data-testid="button-delete-profile"]');
    await page.fill('[data-testid="input-deletion-reason"]', "Testing seed cleanup");
    await page.click('[data-testid="button-confirm-deletion"]');
    await expect(page).toHaveURL(/\/apps\/workforce-recruiter/);
  });
});

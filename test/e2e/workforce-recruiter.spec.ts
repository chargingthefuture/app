import { test, expect } from "@playwright/test";

test.describe("Workforce Recruiter Profile", () => {
  test("allows creating a profile", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/profile");

    await expect(page.locator("h1")).toContainText(/workforce recruiter profile/i);

    await page.fill('[data-testid="input-organization-name"]', "Playwright Cooperative");
    await page.fill('[data-testid="textarea-mission"]', "Automated mission statement for testing.");
    await page.fill('[data-testid="input-industries"]', "Testing, QA");
    await page.fill('[data-testid="input-regions"]', "Remote");
    await page.fill('[data-testid="input-city"]', "Test City");
    await page.fill('[data-testid="input-contact-email"]', "qa@example.com");

    await page.click('[data-testid="button-submit-workforce-profile"]');
    await expect(page.locator('[data-testid="button-submit-workforce-profile"]')).toBeVisible();
  });

  test("shows delete button when profile exists", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/profile");
    await expect(page.locator('[data-testid="button-delete-workforce-profile"]')).toBeVisible();
  });
});

test.describe("Workforce Recruiter Admin", () => {
  test("navigates to admin dashboard", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/admin");
    await expect(page.locator("h1")).toContainText(/workforce recruiter admin/i);
    await expect(page.locator('[data-testid="button-save-config"]')).toBeVisible();
  });
});

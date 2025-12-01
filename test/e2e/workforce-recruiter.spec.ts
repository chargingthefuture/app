import { test, expect } from "@playwright/test";

test.describe("Workforce Recruiter Dashboard", () => {
  test("should render dashboard hero and CTA buttons", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter");

    await expect(page.locator("h1")).toContainText(/workforce recruiter/i);
    await expect(page.locator('[data-testid="button-edit-workforce-profile"]')).toBeVisible();
  });
});

test.describe("Workforce Recruiter Profile", () => {
  test("should allow filling and submitting the profile form", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/profile");

    await expect(page.locator("h1")).toContainText(/profile/i);

    await page.fill('[data-testid="input-organization-name"]', "Safe Harbor Co-op");
    await page.fill('[data-testid="input-recruiter-name"]', "Casey L.");
    await page.fill('[data-testid="input-contact-email"]', "casey@example.org");
    await page.fill('[data-testid="input-candidate-capacity"]', "10");
    await page.fill('[data-testid="input-placements-completed"]', "2");

    await page.click('[data-testid="button-save-workforce-profile"]');

    await expect(page.locator('[data-testid="button-save-workforce-profile"]')).toBeVisible();
  });
});

test.describe("Workforce Recruiter Admin Console", () => {
  test("should show config form and announcements link", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/admin");

    await expect(page.locator("h1")).toContainText(/administration/i);
    await expect(page.locator('[data-testid="button-manage-wr-announcements"]')).toBeVisible();

    await page.fill("textarea[name='missionStatement']", "Support ethical employers.");
    await page.click('[data-testid="button-save-workforce-config"]');
  });
});

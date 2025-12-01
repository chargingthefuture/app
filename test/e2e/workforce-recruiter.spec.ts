import { test, expect } from "@playwright/test";

test.describe("Workforce Recruiter", () => {
  test("creates and updates a Workforce Recruiter profile", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/profile");

    await expect(page.locator("h1")).toContainText(/profile/i);

    await page.fill('[data-testid="input-preferred-name"]', "Playwright User");
    await page.fill('[data-testid="input-preferred-role"]', "Operations assistant");
    await page.fill('[data-testid="input-preferred-industry"]', "Non-profit services");
    await page.selectOption('[data-testid="select-experience-level"]', "entry");
    await page.selectOption('[data-testid="select-work-preference"]', "remote");
    await page.fill('[data-testid="input-city"]', "Seattle");
    await page.fill('[data-testid="input-state"]', "WA");
    await page.selectOption('[data-testid="select-country"]', "United States");

    await page.click('[data-testid="button-submit-workforce-profile"]');

    await expect(page).toHaveURL(/\/apps\/workforce-recruiter/);
  });

  test("allows an admin to manage announcements", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/admin/announcements");

    await expect(page.locator("h1")).toContainText(/announcements/i);

    await page.fill('[data-testid="input-announcement-title"]', "Maintenance window");
    await page.fill('[data-testid="textarea-announcement-content"]', "No new placements over the weekend.");
    await page.selectOption('[data-testid="select-announcement-type"]', "maintenance");
    await page.click('[data-testid="button-save-announcement"]');

    await expect(page.locator('[data-testid^="announcement-"]')).toBeVisible();
  });
});

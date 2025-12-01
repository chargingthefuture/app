import { test, expect } from "@playwright/test";

test.describe("Workforce Recruiter Dashboard", () => {
  test("should load dashboard and CTA buttons", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter");
    await expect(page.locator("h1")).toContainText(/workforce recruiter/i);
    await expect(page.locator('[data-testid="button-edit-profile"]')).toBeVisible();
  });

  test("should expose search input for occupations", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter");
    await page.fill('[data-testid="input-search-occupations"]', "garden");
    await expect(page.locator('[data-testid="input-search-occupations"]')).toHaveValue("garden");
  });
});

test.describe("Workforce Recruiter Profile Flow", () => {
  test("should render create profile form", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/profile");
    await expect(page.locator("h1")).toContainText(/profile/i);
    await expect(page.locator('[data-testid="input-displayName"]')).toBeVisible();
  });

  test("should offer delete button when profile exists", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/profile");
    await expect(page.locator('[data-testid="button-save-profile"]')).toBeVisible();
  });
});

test.describe("Workforce Recruiter Admin", () => {
  test("should show config form inputs", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/admin");
    await expect(page.locator('[data-testid="input-max-applications"]')).toBeVisible();
  });

  test("should render announcements admin page", async ({ page }) => {
    await page.goto("/apps/workforce-recruiter/admin/announcements");
    await expect(page.locator("h1")).toContainText(/announcements/i);
    await expect(page.locator('[data-testid="input-announcement-title"]')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Workforce Recruiter mini-app', () => {
  test('shows dashboard quick actions', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter');
    await expect(page.getByText(/workforce recruiter/i)).toBeVisible();
    await expect(page.getByTestId('button-manage-profile')).toBeVisible();
    await expect(page.getByTestId('button-view-occupations')).toBeVisible();
  });

  test('renders create profile form', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/profile');
    await expect(page.getByTestId('input-fullName')).toBeVisible();
    await page.fill('[data-testid="input-fullName"]', 'Playwright User');
    await expect(page.locator('body')).toContainText(/workforce profile/i);
  });

  test('shows occupations list', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/occupations');
    await page.fill('[data-testid="input-search-occupations"]', 'safety');
    await expect(page).toHaveURL(/workforce-recruiter\/occupations/);
  });
});

import { test, expect } from '@playwright/test';

/**
 * E2E tests for Workforce Recruiter mini-app
 */

test.describe('Workforce Recruiter Profile', () => {
  test('should create a Workforce Recruiter profile', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/profile');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/profile/i);
    
    // Fill profile form
    await page.fill('[data-testid="input-display-name"]', 'Test User');
    await page.fill('[data-testid="input-notes"]', 'Test notes for profile');
    
    // Submit form
    await page.click('[data-testid="button-submit"]');
    
    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/\/apps\/workforce-recruiter/);
  });

  test('should update an existing profile', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/profile');
    
    // Wait for edit form to load
    await expect(page.locator('h1')).toContainText(/edit.*profile/i);
    
    // Update display name
    await page.fill('[data-testid="input-display-name"]', 'Updated Name');
    
    // Update notes
    await page.fill('[data-testid="input-notes"]', 'Updated notes');
    
    // Submit update
    await page.click('[data-testid="button-submit"]');
    
    // Verify success message or redirect
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('should delete profile with confirmation', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/profile');
    
    // Wait for delete button (only visible when profile exists)
    await expect(page.locator('[data-testid="button-delete-profile"]')).toBeVisible();
    
    // Click delete button
    await page.click('[data-testid="button-delete-profile"]');
    
    // Fill confirmation dialog
    await page.fill('[data-testid="input-deletion-reason"]', 'Test deletion');
    
    // Confirm deletion
    await page.click('[data-testid="button-confirm-deletion"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/apps\/workforce-recruiter/);
  });

  test('should not show delete button when profile does not exist', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/profile');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/create.*profile/i);
    
    // Delete button should not be visible
    await expect(page.locator('[data-testid="button-delete-profile"]')).not.toBeVisible();
  });
});

test.describe('Workforce Recruiter Dashboard', () => {
  test('should display dashboard after profile creation', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter');
    
    // Should display dashboard content
    await expect(page.locator('h1')).toContainText(/workforce.*recruiter/i);
  });

  test('should navigate to profile page from dashboard', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter');
    
    // Click on profile link or button (adjust selector based on actual implementation)
    const profileLink = page.locator('a[href*="/profile"]').first();
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await expect(page).toHaveURL(/\/apps\/workforce-recruiter\/profile/);
    }
  });
});

test.describe('Workforce Recruiter Occupations', () => {
  test('should view occupations list', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/occupations');
    
    // Should display occupations page
    await expect(page.locator('h1')).toContainText(/occupations/i);
  });

  test('should view occupation details', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/occupations');
    
    // Click on first occupation if available
    const firstOccupation = page.locator('[data-testid^="occupation-"]').first();
    if (await firstOccupation.isVisible()) {
      await firstOccupation.click();
      // Should navigate to detail page
      await expect(page).toHaveURL(/\/apps\/workforce-recruiter\/occupations\/.+/);
    }
  });
});

test.describe('Workforce Recruiter Meetup Events', () => {
  test('should view meetup events', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/meetup-events');
    
    // Should display meetup events page
    await expect(page.locator('h1')).toContainText(/meetup/i);
  });
});


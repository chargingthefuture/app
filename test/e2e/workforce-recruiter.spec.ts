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
    await page.fill('[data-testid="input-notes"]', 'Updated notes');
    
    // Submit update
    await page.click('[data-testid="button-submit"]');
    
    // Verify success message or redirect
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('should delete profile with confirmation', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/profile');
    
    // Click delete button
    await page.click('[data-testid="button-delete-profile"]');
    
    // Fill confirmation dialog
    await page.fill('[data-testid="input-deletion-reason"]', 'Test deletion');
    
    // Confirm deletion
    await page.click('[data-testid="button-confirm-deletion"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/apps\/workforce-recruiter/);
  });
});

test.describe('Workforce Recruiter Occupations', () => {
  test('should view list of occupations', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/occupations');
    
    // Should display list of occupations
    await expect(page.locator('h1')).toContainText(/occupation/i);
  });

  test('should view occupation details', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/occupations');
    
    // Wait for occupations to load
    await page.waitForSelector('[data-testid^="occupation-"]', { timeout: 10000 });
    
    // Click on first occupation
    await page.click('[data-testid^="occupation-"]:first-child');
    
    // Should show occupation detail page
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Workforce Recruiter Reports', () => {
  test('should view reports page', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/reports');
    
    // Should display reports page
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Workforce Recruiter Admin', () => {
  test('should access admin page', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/admin');
    
    // Should display admin interface
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should manage announcements', async ({ page }) => {
    await page.goto('/apps/workforce-recruiter/admin/announcements');
    
    // Wait for form
    await page.waitForSelector('[data-testid="input-announcement-title"]', { timeout: 10000 });
    
    // Create announcement
    await page.fill('[data-testid="input-announcement-title"]', 'Test Announcement');
    await page.fill('[data-testid="textarea-announcement-content"]', 'Test content');
    
    // Submit
    await page.click('[data-testid="button-submit-announcement"]');
    
    // Verify announcement created
    await expect(page.locator('text=Test Announcement')).toBeVisible();
  });
});



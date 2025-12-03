import { test, expect } from '@playwright/test';

/**
 * E2E tests for Directory mini-app
 */

test.describe('Directory Profile', () => {
  test('should create a Directory profile', async ({ page }) => {
    await page.goto('/apps/directory/profile');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/profile/i);
    
    // Fill profile form
    await page.fill('[data-testid="input-first-name"]', 'Test');
    await page.fill('[data-testid="input-last-name"]', 'User');
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-phone"]', '555-1234');
    await page.selectOption('[data-testid="select-country"]', 'United States');
    await page.fill('[data-testid="input-state"]', 'NY');
    await page.fill('[data-testid="input-city"]', 'New York');
    await page.fill('[data-testid="textarea-bio"]', 'Test bio');
    
    // Set privacy
    await page.check('[data-testid="checkbox-is-public"]');
    
    // Submit form
    await page.click('[data-testid="button-submit"]');
    
    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/\/apps\/directory/);
  });

  test('should update an existing profile', async ({ page }) => {
    await page.goto('/apps/directory/profile');
    
    // Wait for edit form to load
    await expect(page.locator('h1')).toContainText(/edit.*profile/i);
    
    // Update bio
    await page.fill('[data-testid="textarea-bio"]', 'Updated bio');
    
    // Submit update
    await page.click('[data-testid="button-submit"]');
    
    // Verify success message or redirect
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('should delete profile with confirmation', async ({ page }) => {
    await page.goto('/apps/directory/profile');
    
    // Click delete button
    await page.click('[data-testid="button-delete-profile"]');
    
    // Fill confirmation dialog
    await page.fill('[data-testid="input-deletion-reason"]', 'Test deletion');
    
    // Confirm deletion
    await page.click('[data-testid="button-confirm-deletion"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/apps\/directory/);
  });
});

test.describe('Directory Public Listing', () => {
  test('should view public directory', async ({ page }) => {
    await page.goto('/apps/directory/public');
    
    // Should display public profiles
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should filter public profiles', async ({ page }) => {
    await page.goto('/apps/directory/public');
    
    // Wait for profiles to load
    await page.waitForSelector('[data-testid^="profile-"]', { timeout: 10000 });
    
    // Use search/filter
    const searchInput = page.locator('[data-testid="input-search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      
      // Wait for filtered results
      await page.waitForTimeout(500);
    }
    
    // Verify results displayed
    await expect(page.locator('[data-testid^="profile-"]').first()).toBeVisible();
  });

  test('should view profile details', async ({ page }) => {
    await page.goto('/apps/directory/public');
    
    // Wait for profiles
    await page.waitForSelector('[data-testid^="profile-"]');
    
    // Click on first profile
    await page.click('[data-testid^="profile-"]').first();
    
    // Should show profile detail page
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Directory Admin', () => {
  test('should access admin page', async ({ page }) => {
    await page.goto('/apps/directory/admin');
    
    // Should display admin interface
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should view all profiles in admin', async ({ page }) => {
    await page.goto('/apps/directory/admin');
    
    // Should display all profiles including private ones
    await expect(page.locator('[data-testid="admin-profiles-list"]')).toBeVisible();
  });
});



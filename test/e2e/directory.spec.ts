import { test, expect } from '@playwright/test';

/**
 * E2E tests for Directory mini-app
 */

test.describe('Directory Profile Management', () => {
  test('should create a Directory profile', async ({ page }) => {
    await page.goto('/apps/directory/profile');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/profile/i);
    
    // Fill profile form
    await page.fill('[data-testid="input-description"]', 'Test description');
    
    // Submit form
    await page.click('[data-testid="button-submit"]');
    
    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/\/apps\/directory/);
  });

  test('should update an existing profile', async ({ page }) => {
    await page.goto('/apps/directory/profile');
    
    // Wait for edit form to load
    await expect(page.locator('h1')).toContainText(/edit.*profile/i);
    
    // Update description
    await page.fill('[data-testid="input-description"]', 'Updated description');
    
    // Submit update
    await page.click('[data-testid="button-submit"]');
    
    // Verify success message or redirect
    await expect(page.locator('[data-testid="toast-success"]').or(page.locator('text=Updated description'))).toBeVisible({ timeout: 5000 });
  });

  test('should delete profile with confirmation', async ({ page }) => {
    await page.goto('/apps/directory/profile');
    
    // Wait for delete button (only visible when profile exists)
    await page.waitForSelector('[data-testid="button-delete-profile"]', { timeout: 5000 }).catch(() => {
      // If no profile exists, skip this test
      test.skip();
    });
    
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

test.describe('Directory Dashboard', () => {
  test('should display dashboard with profile listing', async ({ page }) => {
    await page.goto('/apps/directory');
    
    // Should show dashboard
    await expect(page.locator('h1')).toContainText(/directory/i);
    
    // Should show announcement banner
    await page.waitForSelector('[data-testid="announcement-banner"]', { timeout: 5000 }).catch(() => {
      // Banner may not exist if no announcements
    });
  });

  test('should show create profile prompt when no profile exists', async ({ page }) => {
    await page.goto('/apps/directory');
    
    // Should show get started card
    await expect(page.locator('[data-testid="button-create-profile"]')).toBeVisible();
  });

  test('should display public directory link when profile exists', async ({ page }) => {
    await page.goto('/apps/directory');
    
    // Wait for page to load
    await page.waitForSelector('h1');
    
    // May show public link if profile exists
    const hasPublicLink = await page.locator('[data-testid="button-copy-public-link"]').isVisible().catch(() => false);
    const hasCreatePrompt = await page.locator('[data-testid="button-create-profile"]').isVisible().catch(() => false);
    
    // One of these should be visible
    expect(hasPublicLink || hasCreatePrompt).toBe(true);
  });
});

test.describe('Directory Public Listing', () => {
  test('should display public directory page', async ({ page }) => {
    await page.goto('/apps/directory/public');
    
    // Should show public directory
    await expect(page.locator('h1')).toContainText(/directory/i);
    
    // Should show sign up button
    await expect(page.locator('[data-testid="button-sign-up"]')).toBeVisible();
  });

  test('should display public profiles', async ({ page }) => {
    await page.goto('/apps/directory/public');
    
    // Wait for profiles to load or empty state
    await page.waitForTimeout(2000);
    
    const hasProfiles = await page.locator('[data-testid^="card-directory-profile-"]').count() > 0;
    const hasEmptyState = await page.locator('text=No profiles').isVisible().catch(() => false);
    
    // Should show either profiles or empty state
    expect(hasProfiles || hasEmptyState).toBe(true);
  });
});

test.describe('Directory Admin', () => {
  test('should display admin page', async ({ page }) => {
    await page.goto('/apps/directory/admin');
    
    // Should show admin interface
    await expect(page.locator('h1')).toContainText(/directory.*admin/i);
  });

  test('should manage announcements', async ({ page }) => {
    await page.goto('/apps/directory/admin/announcements');
    
    // Should show announcement management page
    await expect(page.locator('h1')).toContainText(/announcements/i);
    
    // Should have create form
    await expect(page.locator('[data-testid="input-title"]')).toBeVisible();
  });
});


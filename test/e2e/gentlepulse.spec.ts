import { test, expect } from '@playwright/test';

/**
 * E2E tests for GentlePulse mini-app
 */

test.describe('GentlePulse Library', () => {
  test('should display meditation library', async ({ page }) => {
    await page.goto('/apps/gentlepulse');
    
    // Should show library with meditations
    await expect(page.locator('[data-testid="meditation-library"]')).toBeVisible();
  });

  test('should filter meditations by category', async ({ page }) => {
    await page.goto('/apps/gentlepulse');
    
    // Click category filter
    await page.click('[data-testid="filter-category-anxiety"]');
    
    // Should show filtered meditations
    await expect(page.locator('[data-testid="meditation-card"]')).toBeVisible();
  });

  test('should play a meditation', async ({ page }) => {
    await page.goto('/apps/gentlepulse');
    
    // Click on a meditation card
    await page.click('[data-testid="meditation-card"]').first();
    
    // Should show player or meditation details
    await expect(page.locator('[data-testid="meditation-player"]')).toBeVisible();
  });
});

test.describe('GentlePulse Favorites', () => {
  test('should add meditation to favorites', async ({ page }) => {
    await page.goto('/apps/gentlepulse');
    
    // Click favorite button on a meditation
    await page.click('[data-testid="button-favorite"]').first();
    
    // Should show success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('should filter library to show favorites only', async ({ page }) => {
    await page.goto('/apps/gentlepulse');
    
    // Toggle favorites filter
    await page.click('[data-testid="button-toggle-favorites"]');
    
    // Should show filtered meditations (or empty state if no favorites)
    await expect(page.locator('[data-testid="meditation-card"], [data-testid="empty-state"]')).toBeVisible();
  });

  test('should remove meditation from favorites', async ({ page }) => {
    await page.goto('/apps/gentlepulse');
    
    // First, add a favorite
    await page.click('[data-testid="button-favorite"]').first();
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    
    // Then remove it
    await page.click('[data-testid="button-favorite"]').first();
    
    // Should show success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });
});

test.describe('GentlePulse Progress', () => {
  test('should track meditation progress', async ({ page }) => {
    await page.goto('/apps/gentlepulse');
    
    // Start a meditation
    await page.click('[data-testid="meditation-card"]').first();
    await page.click('[data-testid="button-start-meditation"]');
    
    // Complete meditation (simulate)
    await page.waitForTimeout(1000);
    await page.click('[data-testid="button-complete-meditation"]');
    
    // Should record progress
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('should view progress statistics', async ({ page }) => {
    await page.goto('/apps/gentlepulse/settings');
    
    // Should show progress section
    await expect(page.locator('[data-testid="progress-stats"]')).toBeVisible();
  });
});

test.describe('GentlePulse Navigation', () => {
  test('should navigate between library, support, and settings', async ({ page }) => {
    await page.goto('/apps/gentlepulse');
    
    // Navigate to support
    await page.click('[data-testid="nav-support"]');
    await expect(page).toHaveURL(/\/apps\/gentlepulse\/support/);
    
    // Navigate to settings
    await page.click('[data-testid="nav-settings"]');
    await expect(page).toHaveURL(/\/apps\/gentlepulse\/settings/);
    
    // Navigate back to library
    await page.click('[data-testid="nav-library"]');
    await expect(page).toHaveURL(/\/apps\/gentlepulse/);
  });
});


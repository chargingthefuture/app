import { test, expect } from '@playwright/test';

/**
 * E2E tests for LightHouse mini-app
 */

test.describe('LightHouse Profile Management', () => {
  test('should create a LightHouse profile', async ({ page }) => {
    await page.goto('/apps/lighthouse/profile');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/profile/i);
    
    // Fill profile form
    await page.fill('[data-testid="input-displayName"]', 'Test User');
    await page.selectOption('[data-testid="select-profileType"]', 'seeker');
    
    // Submit form
    await page.click('[data-testid="button-submit"]');
    
    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/\/apps\/lighthouse/);
  });

  test('should update an existing profile', async ({ page }) => {
    await page.goto('/apps/lighthouse/profile');
    
    // Wait for edit form to load
    await expect(page.locator('h1')).toContainText(/edit.*profile/i);
    
    // Update display name
    await page.fill('[data-testid="input-displayName"]', 'Updated Name');
    
    // Submit update
    await page.click('[data-testid="button-submit"]');
    
    // Verify success message or redirect
    await expect(page.locator('[data-testid="toast-success"]').or(page.locator('text=Updated Name'))).toBeVisible({ timeout: 5000 });
  });

  test('should delete profile with confirmation', async ({ page }) => {
    await page.goto('/apps/lighthouse/profile');
    
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
    await expect(page).toHaveURL(/\/apps\/lighthouse/);
  });
});

test.describe('LightHouse Dashboard', () => {
  test('should display dashboard', async ({ page }) => {
    await page.goto('/apps/lighthouse');
    
    // Should show dashboard
    await expect(page.locator('h1')).toContainText(/lighthouse/i);
    
    // Should show announcement banner
    await page.waitForSelector('[data-testid="announcement-banner"]', { timeout: 5000 }).catch(() => {
      // Banner may not exist if no announcements
    });
  });

  test('should show create profile prompt when no profile exists', async ({ page }) => {
    await page.goto('/apps/lighthouse');
    
    // Should show get started card
    await expect(page.locator('[data-testid="button-create-profile"]')).toBeVisible();
  });
});

test.describe('LightHouse Properties', () => {
  test('should create a property listing', async ({ page }) => {
    await page.goto('/apps/lighthouse/property/new');
    
    // Wait for form or profile requirement message
    await page.waitForSelector('[data-testid="input-title"]').or(page.locator('[data-testid="button-create-profile"]')).first();
    
    // If profile required, skip (would need profile setup)
    const needsProfile = await page.locator('[data-testid="button-create-profile"]').isVisible().catch(() => false);
    if (needsProfile) {
      test.skip();
    }
    
    // Fill property form
    await page.fill('[data-testid="input-title"]', 'Test Property');
    await page.fill('[data-testid="textarea-description"]', 'Test description');
    await page.fill('[data-testid="input-address"]', '123 Main St');
    await page.fill('[data-testid="input-city"]', 'New York');
    await page.fill('[data-testid="input-zipCode"]', '10001');
    await page.fill('[data-testid="input-monthlyRent"]', '1000');
    
    // Submit
    await page.click('[data-testid="button-submit"]');
    
    // Should show success
    await expect(page.locator('[data-testid="toast-success"]').or(page.locator('text=Test Property'))).toBeVisible({ timeout: 5000 });
  });

  test('should browse properties', async ({ page }) => {
    await page.goto('/apps/lighthouse/browse');
    
    // Should show browse page
    await expect(page.locator('h1')).toContainText(/browse/i);
    
    // Should show properties list or empty state
    await page.waitForTimeout(2000);
    const hasProperties = await page.locator('[data-testid^="card-property-"]').count() > 0;
    const hasEmptyState = await page.locator('text=No properties').isVisible().catch(() => false);
    
    expect(hasProperties || hasEmptyState).toBe(true);
  });
});

test.describe('LightHouse Matches', () => {
  test('should view matches page', async ({ page }) => {
    await page.goto('/apps/lighthouse/matches');
    
    // Should show matches page
    await expect(page.locator('h1')).toContainText(/matches/i);
    
    // Should show matches list or empty state
    await page.waitForTimeout(2000);
    const hasMatches = await page.locator('[data-testid^="card-match-"]').count() > 0;
    const hasEmptyState = await page.locator('text=No matches').isVisible().catch(() => false);
    
    expect(hasMatches || hasEmptyState).toBe(true);
  });
});

test.describe('LightHouse Admin', () => {
  test('should display admin page', async ({ page }) => {
    await page.goto('/apps/lighthouse/admin');
    
    // Should show admin interface
    await expect(page.locator('h1')).toContainText(/lighthouse.*admin/i);
  });

  test('should manage announcements', async ({ page }) => {
    await page.goto('/apps/lighthouse/admin/announcements');
    
    // Should show announcement management page
    await expect(page.locator('h1')).toContainText(/announcements/i);
    
    // Should have create form
    await expect(page.locator('[data-testid="input-title"]')).toBeVisible();
  });
});


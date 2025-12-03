import { test, expect } from '@playwright/test';

/**
 * E2E tests for LightHouse mini-app
 */

test.describe('LightHouse Profile', () => {
  test('should create a LightHouse profile as seeker', async ({ page }) => {
    await page.goto('/apps/lighthouse/profile');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/profile/i);
    
    // Select profile type
    await page.check('[data-testid="radio-profile-type-seeker"]');
    
    // Fill profile form
    await page.fill('[data-testid="input-display-name"]', 'Test Seeker');
    await page.fill('[data-testid="textarea-bio"]', 'Test bio');
    await page.fill('[data-testid="input-phone-number"]', '555-1234');
    await page.selectOption('[data-testid="select-desired-country"]', 'United States');
    
    // Submit form
    await page.click('[data-testid="button-submit"]');
    
    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/\/apps\/lighthouse/);
  });

  test('should create a LightHouse profile as host', async ({ page }) => {
    await page.goto('/apps/lighthouse/profile');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/profile/i);
    
    // Select profile type
    await page.check('[data-testid="radio-profile-type-host"]');
    
    // Fill profile form
    await page.fill('[data-testid="input-display-name"]', 'Test Host');
    await page.fill('[data-testid="textarea-bio"]', 'Test bio');
    await page.fill('[data-testid="input-phone-number"]', '555-1234');
    
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
    await page.fill('[data-testid="input-display-name"]', 'Updated Name');
    
    // Submit update
    await page.click('[data-testid="button-submit"]');
    
    // Verify success message or redirect
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('should delete profile with confirmation', async ({ page }) => {
    await page.goto('/apps/lighthouse/profile');
    
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

test.describe('LightHouse Properties', () => {
  test('should view properties list (host only)', async ({ page }) => {
    await page.goto('/apps/lighthouse');
    
    // Should display properties if user is host
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should create a property (host only)', async ({ page }) => {
    await page.goto('/apps/lighthouse/properties/new');
    
    // Wait for form
    await page.waitForSelector('[data-testid="input-property-name"]', { timeout: 10000 });
    
    // Fill property form
    await page.fill('[data-testid="input-property-name"]', 'Test Property');
    await page.fill('[data-testid="textarea-property-description"]', 'Test description');
    await page.fill('[data-testid="input-property-address"]', '123 Main St');
    await page.fill('[data-testid="input-property-city"]', 'New York');
    await page.fill('[data-testid="input-property-state"]', 'NY');
    await page.selectOption('[data-testid="select-property-country"]', 'United States');
    
    // Submit
    await page.click('[data-testid="button-submit"]');
    
    // Verify property created
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });
});

test.describe('LightHouse Match Requests', () => {
  test('should create a match request (seeker only)', async ({ page }) => {
    await page.goto('/apps/lighthouse');
    
    // Wait for properties to load
    await page.waitForSelector('[data-testid^="button-request-match-"]', { timeout: 10000 });
    
    // Click request match button on first property
    await page.click('[data-testid^="button-request-match-"]').first();
    
    // Fill message if required
    const messageInput = page.locator('[data-testid="input-match-message"]');
    if (await messageInput.isVisible()) {
      await messageInput.fill('Interested in this property');
    }
    
    // Submit request
    await page.click('[data-testid="button-submit-match-request"]');
    
    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('should view match requests', async ({ page }) => {
    await page.goto('/apps/lighthouse/matches');
    
    // Should display match requests
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should accept a match request (host only)', async ({ page }) => {
    await page.goto('/apps/lighthouse/matches');
    
    // Wait for requests to load
    await page.waitForSelector('[data-testid^="button-accept-match-"]', { timeout: 10000 });
    
    // Click accept button on first request
    await page.click('[data-testid^="button-accept-match-"]').first();
    
    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });
});



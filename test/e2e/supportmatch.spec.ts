import { test, expect } from '@playwright/test';

/**
 * E2E tests for SupportMatch mini-app
 */

test.describe('SupportMatch Profile', () => {
  test('should create a SupportMatch profile', async ({ page }) => {
    await page.goto('/apps/supportmatch/profile');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/profile/i);
    
    // Fill profile form
    await page.fill('[data-testid="input-nickname"]', 'Test User');
    await page.selectOption('[data-testid="select-timezone"]', 'America/New_York');
    await page.fill('[data-testid="input-city"]', 'New York');
    await page.fill('[data-testid="input-state"]', 'NY');
    await page.selectOption('[data-testid="select-country"]', 'United States');
    
    // Submit form
    await page.click('[data-testid="button-submit"]');
    
    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/\/apps\/supportmatch/);
  });

  test('should update an existing profile', async ({ page }) => {
    await page.goto('/apps/supportmatch/profile');
    
    // Wait for edit form to load
    await expect(page.locator('h1')).toContainText(/edit.*profile/i);
    
    // Update nickname
    await page.fill('[data-testid="input-nickname"]', 'Updated Nickname');
    
    // Submit update
    await page.click('[data-testid="button-submit"]');
    
    // Verify success message or redirect
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('should delete profile with confirmation', async ({ page }) => {
    await page.goto('/apps/supportmatch/profile');
    
    // Click delete button
    await page.click('[data-testid="button-delete-profile"]');
    
    // Fill confirmation dialog
    await page.fill('[data-testid="input-deletion-reason"]', 'Test deletion');
    
    // Confirm deletion
    await page.click('[data-testid="button-confirm-deletion"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/apps\/supportmatch/);
  });
});

test.describe('SupportMatch Partnerships', () => {
  test('should view potential partners', async ({ page }) => {
    await page.goto('/apps/supportmatch');
    
    // Should display list of potential partners
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should create a partnership request', async ({ page }) => {
    await page.goto('/apps/supportmatch');
    
    // Wait for potential partners to load
    await page.waitForSelector('[data-testid^="button-request-partnership-"]', { timeout: 10000 });
    
    // Click request partnership button on first partner
    await page.click('[data-testid^="button-request-partnership-"]').first();
    
    // Fill message if required
    const messageInput = page.locator('[data-testid="input-partnership-message"]');
    if (await messageInput.isVisible()) {
      await messageInput.fill('Would like to partner with you');
    }
    
    // Submit request
    await page.click('[data-testid="button-submit-partnership-request"]');
    
    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('should view partnership requests', async ({ page }) => {
    await page.goto('/apps/supportmatch/partnerships');
    
    // Should display partnership requests
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should accept a partnership request', async ({ page }) => {
    await page.goto('/apps/supportmatch/partnerships');
    
    // Wait for requests to load
    await page.waitForSelector('[data-testid^="button-accept-partnership-"]', { timeout: 10000 });
    
    // Click accept button on first request
    await page.click('[data-testid^="button-accept-partnership-"]').first();
    
    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });
});

test.describe('SupportMatch Messaging', () => {
  test('should send a message to partner', async ({ page }) => {
    await page.goto('/apps/supportmatch/messages');
    
    // Wait for messages or partners list
    await page.waitForSelector('[data-testid^="message-"]', { timeout: 10000 }).catch(() => {});
    
    // Click on a partner or conversation
    const partnerLink = page.locator('[data-testid^="link-partner-"]').first();
    if (await partnerLink.isVisible()) {
      await partnerLink.click();
    }
    
    // Fill message input
    await page.fill('[data-testid="input-message"]', 'Test message');
    
    // Send message
    await page.click('[data-testid="button-send-message"]');
    
    // Verify message appears
    await expect(page.locator('[data-testid^="message-"]').last()).toBeVisible();
  });
});

test.describe('SupportMatch Exclusions', () => {
  test('should exclude a user', async ({ page }) => {
    await page.goto('/apps/supportmatch');
    
    // Find exclude button
    const excludeButton = page.locator('[data-testid^="button-exclude-"]').first();
    if (await excludeButton.isVisible()) {
      await excludeButton.click();
      
      // Confirm exclusion if dialog appears
      const confirmButton = page.locator('[data-testid="button-confirm-exclude"]');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Verify success
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    }
  });
});



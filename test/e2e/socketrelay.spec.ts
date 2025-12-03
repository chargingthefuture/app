import { test, expect } from '@playwright/test';

/**
 * E2E tests for SocketRelay mini-app
 */

test.describe('SocketRelay Profile', () => {
  test('should create a SocketRelay profile', async ({ page }) => {
    await page.goto('/apps/socketrelay/profile');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/profile/i);
    
    // Fill profile form
    await page.fill('[data-testid="input-display-name"]', 'Test User');
    await page.selectOption('[data-testid="select-country"]', 'United States');
    await page.fill('[data-testid="input-state"]', 'NY');
    await page.fill('[data-testid="input-city"]', 'New York');
    
    // Submit form
    await page.click('[data-testid="button-submit"]');
    
    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/\/apps\/socketrelay/);
  });

  test('should update an existing profile', async ({ page }) => {
    await page.goto('/apps/socketrelay/profile');
    
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
    await page.goto('/apps/socketrelay/profile');
    
    // Click delete button
    await page.click('[data-testid="button-delete-profile"]');
    
    // Fill confirmation dialog
    await page.fill('[data-testid="input-deletion-reason"]', 'Test deletion');
    
    // Confirm deletion
    await page.click('[data-testid="button-confirm-deletion"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/apps\/socketrelay/);
  });
});

test.describe('SocketRelay Requests', () => {
  test('should create a request', async ({ page }) => {
    await page.goto('/apps/socketrelay/request/new');
    
    // Wait for form
    await page.waitForSelector('[data-testid="input-request-title"]', { timeout: 10000 });
    
    // Fill request form
    await page.fill('[data-testid="input-request-title"]', 'Test Request');
    await page.fill('[data-testid="textarea-request-description"]', 'Test description');
    await page.selectOption('[data-testid="select-request-category"]', 'goods');
    
    // Submit request
    await page.click('[data-testid="button-submit"]');
    
    // Should show success or redirect
    await expect(page).toHaveURL(/\/apps\/socketrelay/);
  });

  test('should view open requests', async ({ page }) => {
    await page.goto('/apps/socketrelay');
    
    // Should display list of open requests
    await expect(page.locator('[data-testid="request-list"]')).toBeVisible();
  });

  test('should fulfill a request', async ({ page }) => {
    await page.goto('/apps/socketrelay');
    
    // Wait for requests to load
    await page.waitForSelector('[data-testid^="button-fulfill-request-"]', { timeout: 10000 });
    
    // Click fulfill button on first request
    await page.click('[data-testid^="button-fulfill-request-"]').first();
    
    // Fill fulfillment message if required
    const messageInput = page.locator('[data-testid="input-fulfillment-message"]');
    if (await messageInput.isVisible()) {
      await messageInput.fill('I can help with this');
    }
    
    // Submit fulfillment
    await page.click('[data-testid="button-submit-fulfillment"]');
    
    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });
});

test.describe('SocketRelay Messaging', () => {
  test('should send a message about a request', async ({ page }) => {
    await page.goto('/apps/socketrelay/messages');
    
    // Wait for messages or requests list
    await page.waitForSelector('[data-testid^="message-"]', { timeout: 10000 }).catch(() => {});
    
    // Click on a request or conversation
    const requestLink = page.locator('[data-testid^="link-request-"]').first();
    if (await requestLink.isVisible()) {
      await requestLink.click();
    }
    
    // Fill message input
    await page.fill('[data-testid="input-message"]', 'Test message');
    
    // Send message
    await page.click('[data-testid="button-send-message"]');
    
    // Verify message appears
    await expect(page.locator('[data-testid^="message-"]').last()).toBeVisible();
  });
});



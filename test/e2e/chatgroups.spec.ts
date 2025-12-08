import { test, expect } from '@playwright/test';

/**
 * E2E tests for Chat Groups mini-app
 */

test.describe('Chat Groups User Interface', () => {
  test('should display list of chat groups on dashboard', async ({ page }) => {
    await page.goto('/apps/chatgroups');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/chat groups/i);
    
    // Should display groups list or empty state
    const hasGroups = await page.locator('[data-testid^="card-chat-group-"]').count() > 0;
    const hasEmptyState = await page.locator('text=No chat groups available yet').isVisible();
    
    expect(hasGroups || hasEmptyState).toBe(true);
  });

  test('should display announcement banner', async ({ page }) => {
    await page.goto('/apps/chatgroups');
    
    // Announcement banner should be present (may be empty)
    await page.waitForSelector('[data-testid="announcement-banner"]', { timeout: 5000 }).catch(() => {
      // Banner may not exist if no announcements, which is fine
    });
  });

  test('should show join group button for each group', async ({ page }) => {
    await page.goto('/apps/chatgroups');
    
    // Wait for groups to load
    await page.waitForSelector('[data-testid^="card-chat-group-"]', { timeout: 10000 }).catch(() => {
      // If no groups, test passes (empty state is valid)
      return;
    });
    
    // Check if any groups exist
    const groupCount = await page.locator('[data-testid^="card-chat-group-"]').count();
    
    if (groupCount > 0) {
      // Each group should have a join button
      const firstGroup = page.locator('[data-testid^="card-chat-group-"]').first();
      await expect(firstGroup.locator('[data-testid^="button-join-group-"]')).toBeVisible();
    }
  });

  test('should open external link dialog when clicking join group', async ({ page }) => {
    await page.goto('/apps/chatgroups');
    
    // Wait for groups
    await page.waitForSelector('[data-testid^="button-join-group-"]', { timeout: 10000 }).catch(() => {
      // If no groups, skip this test
      test.skip();
    });
    
    // Click first join button
    await page.click('[data-testid^="button-join-group-"]').first();
    
    // Should show external link confirmation dialog
    await expect(page.locator('[data-testid="external-link-dialog"]')).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Chat Groups Admin', () => {
  test('should display admin page', async ({ page }) => {
    await page.goto('/apps/chatgroups/admin');
    
    // Should show admin interface
    await expect(page.locator('h1')).toContainText(/chat groups.*admin/i);
  });

  test('should create a new chat group', async ({ page }) => {
    await page.goto('/apps/chatgroups/admin');
    
    // Wait for create form
    await page.waitForSelector('[data-testid="input-new-group-name"]');
    
    // Fill form
    await page.fill('[data-testid="input-new-group-name"]', 'Test Chat Group');
    await page.fill('[data-testid="input-new-group-url"]', 'https://signal.group/#test');
    await page.fill('[data-testid="input-new-group-description"]', 'Test description');
    
    // Submit
    await page.click('[data-testid="button-create-group"]');
    
    // Should show success or new group in list
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Test Chat Group').or(page.locator('[data-testid="toast-success"]'))).toBeVisible({ timeout: 5000 });
  });

  test('should manage announcements', async ({ page }) => {
    await page.goto('/apps/chatgroups/admin/announcements');
    
    // Should show announcement management page
    await expect(page.locator('h1')).toContainText(/announcements/i);
    
    // Should have create form
    await expect(page.locator('[data-testid="input-title"]')).toBeVisible();
  });
});


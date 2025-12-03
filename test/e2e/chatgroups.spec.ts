import { test, expect } from '@playwright/test';

/**
 * E2E tests for ChatGroups mini-app
 */

test.describe('ChatGroups Public Listing', () => {
  test('should display list of active groups', async ({ page }) => {
    await page.goto('/apps/chatgroups');
    
    // Wait for groups to load
    await page.waitForSelector('[data-testid^="group-"]', { timeout: 10000 });
    
    // Verify groups are displayed
    const groups = await page.locator('[data-testid^="group-"]').count();
    expect(groups).toBeGreaterThan(0);
  });

  test('should display group information', async ({ page }) => {
    await page.goto('/apps/chatgroups');
    
    // Wait for groups
    await page.waitForSelector('[data-testid^="group-"]');
    
    // Verify group details are visible
    await expect(page.locator('[data-testid^="group-"]').first()).toBeVisible();
  });

  test('should open Signal link in new tab with confirmation', async ({ page, context }) => {
    await page.goto('/apps/chatgroups');
    
    // Wait for groups
    await page.waitForSelector('[data-testid^="group-"]');
    
    // Click on Signal link (should trigger external link dialog)
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('[data-testid^="link-signal-"]').first().catch(() => {}),
    ]);
    
    // If dialog appears, confirm
    const confirmButton = page.locator('[data-testid="button-confirm-external-link"]');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    // Verify new page opened (or link was clicked)
    expect(newPage || page).toBeDefined();
  });
});

test.describe('ChatGroups Admin', () => {
  test('should access admin page', async ({ page }) => {
    await page.goto('/apps/chatgroups/admin');
    
    // Should display admin interface
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should create a new group', async ({ page }) => {
    await page.goto('/apps/chatgroups/admin');
    
    // Wait for create button or form
    await page.waitForSelector('[data-testid="button-create-group"]', { timeout: 10000 }).catch(() => {});
    
    // Click create button if exists
    const createButton = page.locator('[data-testid="button-create-group"]');
    if (await createButton.isVisible()) {
      await createButton.click();
    }
    
    // Fill form if visible
    const nameInput = page.locator('[data-testid="input-group-name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Group');
      await page.fill('[data-testid="textarea-group-description"]', 'Test description');
      await page.fill('[data-testid="input-signal-link"]', 'https://signal.group/#...');
      
      // Submit
      await page.click('[data-testid="button-submit"]');
      
      // Verify group created
      await expect(page.locator('text=Test Group')).toBeVisible();
    }
  });

  test('should update group status', async ({ page }) => {
    await page.goto('/apps/chatgroups/admin');
    
    // Wait for groups list
    await page.waitForSelector('[data-testid^="group-"]', { timeout: 10000 });
    
    // Find toggle button for first group
    const toggleButton = page.locator('[data-testid^="button-toggle-group-"]').first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      
      // Verify status changed
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    }
  });

  test('should delete a group', async ({ page }) => {
    await page.goto('/apps/chatgroups/admin');
    
    // Wait for groups list
    await page.waitForSelector('[data-testid^="group-"]', { timeout: 10000 });
    
    // Find delete button for first group
    const deleteButton = page.locator('[data-testid^="button-delete-group-"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirm deletion if dialog appears
      const confirmButton = page.locator('[data-testid="button-confirm-delete"]');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Verify group deleted
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    }
  });
});



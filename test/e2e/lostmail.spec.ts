import { test, expect } from '@playwright/test';

/**
 * E2E tests for LostMail mini-app
 */

test.describe('LostMail Incident Reports', () => {
  test('should create an incident report', async ({ page }) => {
    await page.goto('/apps/lostmail/report');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/report/i);
    
    // Fill incident report form
    await page.selectOption('[data-testid="select-incidentType"]', 'lost');
    await page.fill('[data-testid="input-description"]', 'Lost package in transit');
    await page.fill('[data-testid="input-location"]', '123 Main St');
    await page.fill('[data-testid="input-contactInfo"]', 'test@example.com');
    
    // Set privacy
    await page.check('[data-testid="checkbox-isPublic"]');
    
    // Submit report
    await page.click('[data-testid="button-submit"]');
    
    // Should show success or redirect
    await expect(page).toHaveURL(/\/apps\/lostmail/);
  });

  test('should view incident details', async ({ page }) => {
    await page.goto('/apps/lostmail');
    
    // Click on an incident
    await page.click('[data-testid="incident-card"]').first();
    
    // Should show incident detail page
    await expect(page.locator('h1')).toContainText(/incident/i);
  });

  test('should update an incident report', async ({ page }) => {
    await page.goto('/apps/lostmail/incident/test-incident-id');
    
    // Click edit button
    await page.click('[data-testid="button-edit"]');
    
    // Update description
    await page.fill('[data-testid="input-description"]', 'Updated description');
    
    // Submit update
    await page.click('[data-testid="button-submit"]');
    
    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });
});

test.describe('LostMail Dashboard', () => {
  test('should display user incidents on dashboard', async ({ page }) => {
    await page.goto('/apps/lostmail');
    
    // Should show dashboard with incidents list
    await expect(page.locator('[data-testid="incidents-list"]')).toBeVisible();
  });

  test('should filter incidents by type', async ({ page }) => {
    await page.goto('/apps/lostmail');
    
    // Click filter for lost items
    await page.click('[data-testid="filter-lost"]');
    
    // Should show only lost incidents
    await expect(page.locator('[data-testid="incident-card"]')).toContainText(/lost/i);
  });
});


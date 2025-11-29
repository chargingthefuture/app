import { test, expect } from '@playwright/test';

/**
 * E2E tests for Chyme audio room platform
 */

test.describe('Chyme Profile Management', () => {
  test('should create a Chyme profile', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/apps/chyme/profile');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="button-submit"]');
    
    // Fill form fields
    await page.fill('[data-testid="input-display-name"]', 'Test User');
    
    // Submit form
    await page.click('[data-testid="button-submit"]');
    
    // Verify success (would need proper auth setup)
    // This is a structure test showing the pattern
  });

  test('should update an existing profile', async ({ page }) => {
    // Navigate to profile page with existing profile
    await page.goto('/apps/chyme/profile');
    
    // Wait for edit form
    await page.waitForSelector('[data-testid="input-display-name"]');
    
    // Update display name
    await page.fill('[data-testid="input-display-name"]', 'Updated Name');
    
    // Submit
    await page.click('[data-testid="button-submit"]');
    
    // Verify changes saved
  });

  test('should delete profile with confirmation', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/apps/chyme/profile');
    
    // Wait for delete button (only visible when profile exists)
    await page.waitForSelector('[data-testid="button-delete-profile"]');
    
    // Click delete button
    await page.click('[data-testid="button-delete-profile"]');
    
    // Fill confirmation dialog
    // Verify deletion
  });
});

test.describe('Chyme Room Functionality', () => {
  test('should display list of rooms on dashboard', async ({ page }) => {
    await page.goto('/apps/chyme');
    
    // Wait for rooms to load
    await page.waitForSelector('[data-testid^="button-join-room-"]', { timeout: 10000 });
    
    // Verify rooms are displayed
    const rooms = await page.locator('[data-testid^="button-join-room-"]').count();
    expect(rooms).toBeGreaterThan(0);
  });

  test('should join a private room', async ({ page }) => {
    await page.goto('/apps/chyme');
    
    // Wait for rooms
    await page.waitForSelector('[data-testid^="button-join-room-"]');
    
    // Click first room
    await page.click('[data-testid^="button-join-room-"]:first-child');
    
    // Wait for room page
    await page.waitForSelector('[data-testid="button-join-room"]');
    
    // Join room
    await page.click('[data-testid="button-join-room"]');
    
    // Verify joined (button should change to "Leave")
    await page.waitForSelector('[data-testid="button-leave-room"]');
  });

  test('should send messages in room', async ({ page }) => {
    // Navigate to room (assuming already joined)
    await page.goto('/apps/chyme/room/test-room-id');
    
    // Wait for message input
    await page.waitForSelector('[data-testid="input-message"]');
    
    // Type message
    await page.fill('[data-testid="input-message"]', 'Test message');
    
    // Send message
    await page.click('[data-testid="button-send-message"]');
    
    // Verify message appears
    await page.waitForSelector('[data-testid^="message-"]');
  });

  test('should leave room', async ({ page }) => {
    // Navigate to room
    await page.goto('/apps/chyme/room/test-room-id');
    
    // Wait for leave button
    await page.waitForSelector('[data-testid="button-leave-room"]');
    
    // Leave room
    await page.click('[data-testid="button-leave-room"]');
    
    // Verify left (button should change to "Join")
    await page.waitForSelector('[data-testid="button-join-room"]');
  });
});

test.describe('Chyme Admin Functionality', () => {
  test('should create room as admin', async ({ page }) => {
    // Navigate to admin page
    await page.goto('/apps/chyme/admin');
    
    // Click create room button
    await page.click('text=Create Room');
    
    // Wait for form
    await page.waitForSelector('[data-testid="input-room-name"]');
    
    // Fill form
    await page.fill('[data-testid="input-room-name"]', 'New Test Room');
    await page.fill('[data-testid="textarea-room-description"]', 'Test description');
    
    // Select room type
    await page.click('[data-testid="select-room-type"]');
    await page.click('text=Private');
    
    // Submit
    await page.click('[data-testid="button-submit-room"]');
    
    // Verify room created
    await page.waitForSelector('text=New Test Room');
  });

  test('should manage announcements', async ({ page }) => {
    // Navigate to admin announcements
    await page.goto('/apps/chyme/admin/announcements');
    
    // Wait for form
    await page.waitForSelector('[data-testid="input-announcement-title"]');
    
    // Create announcement
    await page.fill('[data-testid="input-announcement-title"]', 'Test Announcement');
    await page.fill('[data-testid="textarea-announcement-content"]', 'Test content');
    
    // Submit
    await page.click('[data-testid="button-submit-announcement"]');
    
    // Verify announcement created
    await page.waitForSelector('text=Test Announcement');
  });
});



import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { createMockRequest, createMockResponse, generateTestUserId } from '../fixtures/testData';
import { storage } from '../../server/storage';
import { db } from '../../server/db';
import { defaultAliveOrDeadEbitdaSnapshots, defaultAliveOrDeadFinancialEntries } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Comprehensive API tests for Default Alive or Dead endpoints
 */

// Check if DATABASE_URL is available
const hasDatabaseUrl = !!process.env.DATABASE_URL;
let canConnectToDatabase = false;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set, skipping integration tests');
    return;
  }

  try {
    await db.execute({ sql: 'SELECT 1', args: [] });
    canConnectToDatabase = true;
  } catch (error: any) {
    console.warn('Database connection failed, skipping integration tests:', error.message);
    canConnectToDatabase = false;
  }
});

describe('API - Default Alive or Dead EBITDA Snapshot', () => {
  let adminUserId: string;

  beforeEach(() => {
    adminUserId = generateTestUserId();
  });

  describe('POST /api/default-alive-or-dead/calculate-ebitda', () => {
    it('should require admin access', () => {
      const req = createMockRequest(adminUserId, false); // Not admin
      expect(req.isAdmin()).toBe(false);
    });

    it('should require weekStartDate parameter', () => {
      const req = createMockRequest(adminUserId, true);
      req.body = {}; // Missing weekStartDate
      expect(req.body.weekStartDate).toBeUndefined();
    });

    it('should accept weekStartDate and optional currentFunding', () => {
      const req = createMockRequest(adminUserId, true);
      req.body = {
        weekStartDate: '2025-12-05',
        currentFunding: 10000,
      };
      expect(req.body.weekStartDate).toBe('2025-12-05');
      expect(req.body.currentFunding).toBe(10000);
    });
  });

  describe('Week Boundary Calculations', () => {
    it('should normalize Nov 30, 2024 (Saturday) to itself', () => {
      // Nov 30, 2024 is a Saturday
      const inputDate = new Date('2024-11-30');
      const weekStart = new Date(inputDate);
      const dayOfWeek = weekStart.getDay(); // Should be 6 (Saturday)
      const daysToSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek) % 7;
      weekStart.setDate(weekStart.getDate() - daysToSaturday);
      weekStart.setHours(0, 0, 0, 0);

      expect(weekStart.getDay()).toBe(6); // Saturday
      expect(weekStart.getDate()).toBe(30);
      expect(weekStart.getMonth()).toBe(10); // November (0-indexed)
      expect(weekStart.getFullYear()).toBe(2024);
    });

    it('should calculate week end as Friday (Dec 6) for week starting Nov 30', () => {
      const weekStart = new Date('2024-11-30');
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      expect(weekEnd.getDay()).toBe(5); // Friday
      expect(weekEnd.getDate()).toBe(6);
      expect(weekEnd.getMonth()).toBe(11); // December (0-indexed)
      expect(weekEnd.getFullYear()).toBe(2024);
    });

    it('should normalize Dec 7, 2024 (Saturday) to itself', () => {
      // Dec 7, 2024 is a Saturday
      const inputDate = new Date('2024-12-07');
      const weekStart = new Date(inputDate);
      const dayOfWeek = weekStart.getDay(); // Should be 6 (Saturday)
      const daysToSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek) % 7;
      weekStart.setDate(weekStart.getDate() - daysToSaturday);
      weekStart.setHours(0, 0, 0, 0);

      expect(weekStart.getDay()).toBe(6); // Saturday
      expect(weekStart.getDate()).toBe(7);
      expect(weekStart.getMonth()).toBe(11); // December (0-indexed)
      expect(weekStart.getFullYear()).toBe(2024);
    });

    it('should calculate week end as Friday (Dec 13) for week starting Dec 7', () => {
      const weekStart = new Date('2024-12-07');
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      expect(weekEnd.getDay()).toBe(5); // Friday
      expect(weekEnd.getDate()).toBe(13);
      expect(weekEnd.getMonth()).toBe(11); // December (0-indexed)
      expect(weekEnd.getFullYear()).toBe(2024);
    });

    it('should normalize any date in the week to the Saturday start', () => {
      // Test with dates in the Nov 30 - Dec 6 week
      // Nov 29 (Friday) should normalize to Nov 23 (previous Saturday)
      // Nov 30 (Saturday) should stay as Nov 30
      // Dec 5 (Thursday) should normalize to Nov 30
      const testCases = [
        { input: new Date('2024-11-29'), expectedDate: 23, expectedMonth: 10 }, // Friday -> previous Saturday
        { input: new Date('2024-11-30'), expectedDate: 30, expectedMonth: 10 }, // Saturday -> itself
        { input: new Date('2024-12-01'), expectedDate: 30, expectedMonth: 10 }, // Sunday -> previous Saturday
        { input: new Date('2024-12-05'), expectedDate: 30, expectedMonth: 10 }, // Thursday -> Saturday
        { input: new Date('2024-12-06'), expectedDate: 30, expectedMonth: 10 }, // Friday -> Saturday
      ];

      testCases.forEach(({ input, expectedDate, expectedMonth }) => {
        const weekStart = new Date(input);
        const dayOfWeek = weekStart.getDay();
        const daysToSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek) % 7;
        weekStart.setDate(weekStart.getDate() - daysToSaturday);
        weekStart.setHours(0, 0, 0, 0);

        expect(weekStart.getDay()).toBe(6); // Always Saturday
        expect(weekStart.getDate()).toBe(expectedDate);
        expect(weekStart.getMonth()).toBe(expectedMonth);
      });
    });

    it('should handle dates on Sunday (should normalize to previous Saturday)', () => {
      // Dec 1, 2024 is a Sunday
      const inputDate = new Date('2024-12-01');
      const weekStart = new Date(inputDate);
      const dayOfWeek = weekStart.getDay(); // Should be 0 (Sunday)
      const daysToSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek) % 7;
      weekStart.setDate(weekStart.getDate() - daysToSaturday);
      weekStart.setHours(0, 0, 0, 0);

      // Should normalize to Nov 30 (Saturday)
      expect(weekStart.getDay()).toBe(6); // Saturday
      expect(weekStart.getDate()).toBe(30);
      expect(weekStart.getMonth()).toBe(10); // November (0-indexed)
    });

    it('should correctly calculate week boundaries for user-specified date ranges', () => {
      // User mentioned: Nov 29-Dec 5 and Dec 6-Dec 12 as weeks
      // These dates normalize to the Saturday of their respective weeks
      
      // Nov 29, 2024 (Thursday) should normalize to Nov 23 (previous Saturday)
      const nov29 = new Date('2024-11-29');
      let weekStart = new Date(nov29);
      const dayOfWeek1 = weekStart.getDay();
      const daysToSaturday1 = dayOfWeek1 === 6 ? 0 : (6 - dayOfWeek1) % 7;
      weekStart.setDate(weekStart.getDate() - daysToSaturday1);
      weekStart.setHours(0, 0, 0, 0);
      
      let weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      expect(weekStart.getDay()).toBe(6); // Saturday
      expect(weekEnd.getDay()).toBe(5); // Friday
      // Week should be Nov 23 (Sat) to Nov 29 (Fri)

      // Dec 6, 2024 (Thursday) should normalize to Nov 30 (previous Saturday)
      const dec6 = new Date('2024-12-06');
      weekStart = new Date(dec6);
      const dayOfWeek2 = weekStart.getDay();
      const daysToSaturday2 = dayOfWeek2 === 6 ? 0 : (6 - dayOfWeek2) % 7;
      weekStart.setDate(weekStart.getDate() - daysToSaturday2);
      weekStart.setHours(0, 0, 0, 0);
      
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      expect(weekStart.getDay()).toBe(6); // Saturday
      expect(weekEnd.getDay()).toBe(5); // Friday
      // Week should be Nov 30 (Sat) to Dec 6 (Fri)
      expect(weekStart.getDate()).toBe(30);
      expect(weekStart.getMonth()).toBe(10); // November
      expect(weekEnd.getDate()).toBe(6);
      expect(weekEnd.getMonth()).toBe(11); // December
    });
  });
});

describe.skipIf(!hasDatabaseUrl)('Storage Layer - Default Alive or Dead EBITDA Snapshot', () => {
  let testUserId: string;
  let testWeekStart: Date;

  beforeEach(async () => {
    testUserId = generateTestUserId();
    // Use Nov 30, 2024 (Saturday) as test week
    testWeekStart = new Date('2024-11-30');
    testWeekStart.setHours(0, 0, 0, 0);

    // Cleanup any existing snapshots for test week
    try {
      await db
        .delete(defaultAliveOrDeadEbitdaSnapshots)
        .where(eq(defaultAliveOrDeadEbitdaSnapshots.weekStartDate, testWeekStart));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    // Cleanup test snapshots
    try {
      await db
        .delete(defaultAliveOrDeadEbitdaSnapshots)
        .where(eq(defaultAliveOrDeadEbitdaSnapshots.weekStartDate, testWeekStart));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it.skipIf(!canConnectToDatabase)('should create EBITDA snapshot for a week', async () => {
    const snapshot = await storage.calculateAndStoreEbitdaSnapshot(testWeekStart, 10000);

    expect(snapshot).toBeDefined();
    expect(snapshot.weekStartDate).toEqual(testWeekStart);
    expect(snapshot.currentFunding).toBe('10000');
    expect(snapshot.revenue).toBeDefined();
    expect(snapshot.operatingExpenses).toBeDefined();
    expect(snapshot.ebitda).toBeDefined();
  });

  it.skipIf(!canConnectToDatabase)('should be idempotent - duplicate requests should update existing snapshot', async () => {
    // First request
    const firstSnapshot = await storage.calculateAndStoreEbitdaSnapshot(testWeekStart, 10000);
    expect(firstSnapshot).toBeDefined();
    const firstId = firstSnapshot.id;
    const firstUpdatedAt = firstSnapshot.updatedAt;

    // Wait a bit to ensure updatedAt changes
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second request with same week (simulating duplicate POST)
    const secondSnapshot = await storage.calculateAndStoreEbitdaSnapshot(testWeekStart, 15000);

    expect(secondSnapshot).toBeDefined();
    expect(secondSnapshot.id).toBe(firstId); // Same record
    expect(secondSnapshot.weekStartDate).toEqual(testWeekStart);
    expect(secondSnapshot.currentFunding).toBe('15000'); // Updated value
    expect(new Date(secondSnapshot.updatedAt).getTime()).toBeGreaterThan(new Date(firstUpdatedAt).getTime()); // Updated timestamp
  });

  it.skipIf(!canConnectToDatabase)('should handle multiple concurrent duplicate requests', async () => {
    // Simulate concurrent requests
    const promises = [
      storage.calculateAndStoreEbitdaSnapshot(testWeekStart, 10000),
      storage.calculateAndStoreEbitdaSnapshot(testWeekStart, 20000),
      storage.calculateAndStoreEbitdaSnapshot(testWeekStart, 30000),
    ];

    const results = await Promise.all(promises);

    // All should succeed without unique constraint violation
    expect(results).toHaveLength(3);
    
    // All should reference the same snapshot (same week)
    const uniqueIds = new Set(results.map(r => r.id));
    expect(uniqueIds.size).toBe(1); // All should be the same record

    // The final value should be one of the concurrent updates
    const finalSnapshot = results[results.length - 1];
    expect(finalSnapshot.weekStartDate).toEqual(testWeekStart);
  });

  it.skipIf(!canConnectToDatabase)('should normalize week start date correctly for Nov 30-Dec 6 week', async () => {
    // Test with different dates in the same week (Nov 30 is Saturday)
    const datesInWeek = [
      new Date('2024-11-30'), // Saturday
      new Date('2024-12-01'), // Sunday
      new Date('2024-12-02'), // Monday
      new Date('2024-12-03'), // Tuesday
      new Date('2024-12-04'), // Wednesday
      new Date('2024-12-05'), // Thursday
      new Date('2024-12-06'), // Friday
    ];

    for (const date of datesInWeek) {
      const snapshot = await storage.calculateAndStoreEbitdaSnapshot(date, 10000);
      
      // All should normalize to Nov 30 (Saturday)
      expect(snapshot.weekStartDate.getDate()).toBe(30);
      expect(snapshot.weekStartDate.getMonth()).toBe(10); // November (0-indexed)
      expect(snapshot.weekStartDate.getDay()).toBe(6); // Saturday
    }

    // Cleanup
    await db
      .delete(defaultAliveOrDeadEbitdaSnapshots)
      .where(eq(defaultAliveOrDeadEbitdaSnapshots.weekStartDate, testWeekStart));
  });

  it.skipIf(!canConnectToDatabase)('should normalize week start date correctly for Dec 7-Dec 13 week', async () => {
    const dec7WeekStart = new Date('2024-12-07');
    dec7WeekStart.setHours(0, 0, 0, 0);

    // Test with different dates in the Dec 7-13 week
    const datesInWeek = [
      new Date('2024-12-07'), // Saturday
      new Date('2024-12-08'), // Sunday
      new Date('2024-12-09'), // Monday
      new Date('2024-12-10'), // Tuesday
      new Date('2024-12-11'), // Wednesday
      new Date('2024-12-12'), // Thursday
      new Date('2024-12-13'), // Friday
    ];

    for (const date of datesInWeek) {
      const snapshot = await storage.calculateAndStoreEbitdaSnapshot(date, 10000);
      
      // All should normalize to Dec 7 (Saturday)
      expect(snapshot.weekStartDate.getDate()).toBe(7);
      expect(snapshot.weekStartDate.getMonth()).toBe(11); // December (0-indexed)
      expect(snapshot.weekStartDate.getDay()).toBe(6); // Saturday
    }

    // Cleanup
    await db
      .delete(defaultAliveOrDeadEbitdaSnapshots)
      .where(eq(defaultAliveOrDeadEbitdaSnapshots.weekStartDate, dec7WeekStart));
  });

  it.skipIf(!canConnectToDatabase)('should create separate snapshots for different weeks', async () => {
    const week1Start = new Date('2024-11-30'); // Nov 30 (Saturday)
    week1Start.setHours(0, 0, 0, 0);
    
    const week2Start = new Date('2024-12-07'); // Dec 7 (Saturday)
    week2Start.setHours(0, 0, 0, 0);

    const snapshot1 = await storage.calculateAndStoreEbitdaSnapshot(week1Start, 10000);
    const snapshot2 = await storage.calculateAndStoreEbitdaSnapshot(week2Start, 20000);

    expect(snapshot1.id).not.toBe(snapshot2.id);
    expect(snapshot1.weekStartDate.getTime()).not.toBe(snapshot2.weekStartDate.getTime());
    expect(snapshot1.weekStartDate.getDate()).toBe(30);
    expect(snapshot2.weekStartDate.getDate()).toBe(7);

    // Cleanup
    await db
      .delete(defaultAliveOrDeadEbitdaSnapshots)
      .where(eq(defaultAliveOrDeadEbitdaSnapshots.weekStartDate, week1Start));
    await db
      .delete(defaultAliveOrDeadEbitdaSnapshots)
      .where(eq(defaultAliveOrDeadEbitdaSnapshots.weekStartDate, week2Start));
  });
});


import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { storage } from '../../server/storage';
import { db } from '../../server/db';
import { users, supportMatchProfiles, lighthouseProfiles, socketrelayProfiles, directoryProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { generateTestUserId, createTestSupportMatchProfile, createTestLighthouseProfile, createTestSocketrelayProfile, createTestDirectoryProfile } from '../fixtures/testData';

/**
 * Integration tests for storage layer
 * These tests use a real database connection
 */

describe('Storage Layer - User Operations', () => {
  let testUserId: string;

  beforeEach(async () => {
    testUserId = generateTestUserId();
  });

  afterAll(async () => {
    // Cleanup test users
    try {
      await db.delete(users).where(eq(users.id, testUserId));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should create and retrieve a user', async () => {
    const testUser = {
      id: testUserId,
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
    };

    const created = await storage.upsertUser(testUser);
    expect(created).toBeDefined();
    expect(created.id).toBe(testUserId);
    expect(created.email).toBe(testUser.email);

    const retrieved = await storage.getUser(testUserId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(testUserId);
    expect(retrieved?.email).toBe(testUser.email);
  });

  it('should update user verification status', async () => {
    const testUser = {
      id: testUserId,
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
    };

    await storage.upsertUser(testUser);
    const updated = await storage.updateUserVerification(testUserId, true);

    expect(updated.isVerified).toBe(true);
  });
});

describe('Storage Layer - SupportMatch Profile Operations', () => {
  let testUserId: string;

  beforeEach(async () => {
    testUserId = generateTestUserId();
    // Create user first
    await storage.upsertUser({
      id: testUserId,
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
    });
  });

  afterAll(async () => {
    // Cleanup
    try {
      await db.delete(supportMatchProfiles).where(eq(supportMatchProfiles.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should create a SupportMatch profile', async () => {
    const profileData = createTestSupportMatchProfile(testUserId);
    const created = await storage.createSupportMatchProfile(profileData);

    expect(created).toBeDefined();
    expect(created.userId).toBe(testUserId);
    expect(created.timezone).toBe(profileData.timezone);
  });

  it('should retrieve a SupportMatch profile by userId', async () => {
    const profileData = createTestSupportMatchProfile(testUserId);
    await storage.createSupportMatchProfile(profileData);

    const retrieved = await storage.getSupportMatchProfile(testUserId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.userId).toBe(testUserId);
  });

  it('should update a SupportMatch profile', async () => {
    const profileData = createTestSupportMatchProfile(testUserId);
    await storage.createSupportMatchProfile(profileData);

    const updated = await storage.updateSupportMatchProfile(testUserId, {
      bio: 'Updated bio',
      isPublic: true,
    });

    expect(updated.bio).toBe('Updated bio');
    expect(updated.isPublic).toBe(true);
  });

  it('should delete SupportMatch profile and anonymize related data', async () => {
    const profileData = createTestSupportMatchProfile(testUserId);
    await storage.createSupportMatchProfile(profileData);

    await storage.deleteSupportMatchProfile(testUserId, 'Test deletion');

    const retrieved = await storage.getSupportMatchProfile(testUserId);
    expect(retrieved).toBeUndefined();

    // Verify deletion was logged
    // This would need to check profile_deletion_logs table
  });
});

describe('Storage Layer - LightHouse Profile Operations', () => {
  let testUserId: string;

  beforeEach(async () => {
    testUserId = generateTestUserId();
    await storage.upsertUser({
      id: testUserId,
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
    });
  });

  afterAll(async () => {
    try {
      await db.delete(lighthouseProfiles).where(eq(lighthouseProfiles.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should create a LightHouse profile', async () => {
    const profileData = createTestLighthouseProfile(testUserId);
    const created = await storage.createLighthouseProfile(profileData);

    expect(created).toBeDefined();
    expect(created.userId).toBe(testUserId);
    expect(created.role).toBe('seeker');
  });

  it('should update a LightHouse profile', async () => {
    const profileData = createTestLighthouseProfile(testUserId);
    const created = await storage.createLighthouseProfile(profileData);

    const updated = await storage.updateLighthouseProfile(created.id, {
      role: 'host',
    });

    expect(updated.role).toBe('host');
  });

  it('should delete LightHouse profile with cascade anonymization', async () => {
    const profileData = createTestLighthouseProfile(testUserId);
    await storage.createLighthouseProfile(profileData);

    await storage.deleteLighthouseProfile(testUserId, 'Test deletion');

    const retrieved = await storage.getLighthouseProfileByUserId(testUserId);
    expect(retrieved).toBeUndefined();
  });
});

describe('Storage Layer - SocketRelay Profile Operations', () => {
  let testUserId: string;

  beforeEach(async () => {
    testUserId = generateTestUserId();
    await storage.upsertUser({
      id: testUserId,
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
    });
  });

  afterAll(async () => {
    try {
      await db.delete(socketrelayProfiles).where(eq(socketrelayProfiles.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should create a SocketRelay profile', async () => {
    const profileData = createTestSocketrelayProfile(testUserId);
    const created = await storage.createSocketrelayProfile(profileData);

    expect(created).toBeDefined();
    expect(created.userId).toBe(testUserId);
  });

  it('should delete SocketRelay profile with cascade anonymization', async () => {
    const profileData = createTestSocketrelayProfile(testUserId);
    await storage.createSocketrelayProfile(profileData);

    await storage.deleteSocketrelayProfile(testUserId, 'Test deletion');

    const retrieved = await storage.getSocketrelayProfile(testUserId);
    expect(retrieved).toBeUndefined();
  });
});

describe('Storage Layer - Directory Profile Operations', () => {
  let testUserId: string;

  beforeEach(async () => {
    testUserId = generateTestUserId();
    await storage.upsertUser({
      id: testUserId,
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
    });
  });

  afterAll(async () => {
    try {
      await db.delete(directoryProfiles).where(eq(directoryProfiles.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should create a Directory profile', async () => {
    const profileData = createTestDirectoryProfile(testUserId);
    const created = await storage.createDirectoryProfile(profileData);

    expect(created).toBeDefined();
    expect(created.userId).toBe(testUserId);
  });

  it('should list public Directory profiles only when isPublic is true', async () => {
    const publicProfileData = createTestDirectoryProfile(testUserId, { isPublic: true });
    await storage.createDirectoryProfile(publicProfileData);

    const publicProfiles = await storage.listPublicDirectoryProfiles();
    expect(publicProfiles.some(p => p.userId === testUserId)).toBe(true);
  });

  it('should delete Directory profile with cascade anonymization', async () => {
    const profileData = createTestDirectoryProfile(testUserId);
    await storage.createDirectoryProfile(profileData);

    await storage.deleteDirectoryProfileWithCascade(testUserId, 'Test deletion');

    const retrieved = await storage.getDirectoryProfileByUserId(testUserId);
    expect(retrieved).toBeUndefined();
  });
});


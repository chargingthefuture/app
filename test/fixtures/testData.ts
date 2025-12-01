import { vi } from 'vitest';
import type { InsertSupportMatchProfile } from '@shared/schema';
import type { InsertLighthouseProfile } from '@shared/schema';
import type { InsertSocketrelayProfile } from '@shared/schema';
import type { InsertDirectoryProfile } from '@shared/schema';

/**
 * Test data fixtures for creating consistent test data
 */

export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  profileImageUrl: null,
  isAdmin: false,
  isVerified: false,
  isApproved: true,
  pricingTier: '1.00',
  subscriptionStatus: 'active' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestAdminUser = (overrides = {}) =>
  createTestUser({ ...overrides, isAdmin: true });

export const createTestSupportMatchProfile = (
  userId: string,
  overrides: Partial<InsertSupportMatchProfile> = {}
): InsertSupportMatchProfile => ({
  userId,
  timezone: 'America/New_York',
  availabilityStart: '09:00',
  availabilityEnd: '17:00',
  preferredCommunicationMethod: 'text',
  interests: ['recovery', 'therapy'],
  bio: 'Test bio',
  isPublic: false,
  ...overrides,
});

export const createTestLighthouseProfile = (
  userId: string,
  overrides: Partial<InsertLighthouseProfile> = {}
): InsertLighthouseProfile => ({
  userId,
  role: 'seeker',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '555-1234',
  country: 'United States',
  state: 'NY',
  city: 'New York',
  bio: 'Test bio',
  isPublic: false,
  ...overrides,
});

export const createTestSocketrelayProfile = (
  userId: string,
  overrides: Partial<InsertSocketrelayProfile> = {}
): InsertSocketrelayProfile => ({
  userId,
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '555-1234',
  country: 'United States',
  state: 'NY',
  city: 'New York',
  bio: 'Test bio',
  ...overrides,
});

export const createTestDirectoryProfile = (
  userId: string,
  overrides: Partial<InsertDirectoryProfile> = {}
): InsertDirectoryProfile => ({
  userId,
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '555-1234',
  country: 'United States',
  state: 'NY',
  city: 'New York',
  bio: 'Test bio',
  isPublic: false,
  ...overrides,
});

/**
 * Generate a unique test user ID
 */
export const generateTestUserId = () => `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Mock request object for testing
 */
export const createMockRequest = (userId?: string, isAdmin = false) => ({
  user: userId
    ? {
        claims: { sub: userId },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'test-refresh-token',
        isAdmin,
      }
    : null,
  isAuthenticated: () => !!userId,
  body: {},
  params: {},
  query: {},
  headers: {},
  get: () => 'test-host',
  hostname: 'localhost',
} as any);

/**
 * Mock response object for testing
 */
export const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  };
  return res as any;
};


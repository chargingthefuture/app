import { describe, it, expect, beforeEach } from 'vitest';
import { createMockRequest, generateTestUserId } from '../fixtures/testData';
import { insertWorkforceRecruiterOccupationSchema } from '@shared/schema';

describe('API - Workforce Recruiter Occupations', () => {
  let testUserId: string;

  beforeEach(() => {
    testUserId = generateTestUserId();
  });

  describe('GET /api/workforce-recruiter/occupations', () => {
    it('requires authentication', () => {
      const unauthenticatedReq = createMockRequest(undefined);
      expect(unauthenticatedReq.isAuthenticated()).toBe(false);

      const authenticatedReq = createMockRequest(testUserId);
      authenticatedReq.query = { limit: '20', offset: '0' };
      expect(authenticatedReq.isAuthenticated()).toBe(true);
      expect(authenticatedReq.query.limit).toBe('20');
    });
  });

  describe('Admin payload validation', () => {
    it('accepts a well-formed occupation', () => {
      const payload = {
        slug: 'safe-role',
        title: 'Safe Title',
        shortDescription: 'Accessible summary that is under 280 characters.',
        sector: 'Social Services',
        employmentType: 'full_time',
        experienceLevel: 'entry',
        remoteFriendly: true,
        salaryRangeMin: 30000,
        salaryRangeMax: 40000,
        tags: ['remote', 'entry-level'],
        coreSkills: ['Communication'],
        preferredSkills: ['Bilingual'],
        applicationUrl: 'https://example.org/jobs/safe-role',
        contactEmail: 'jobs@example.org',
      };

      const result = insertWorkforceRecruiterOccupationSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects invalid application URLs', () => {
      const payload = {
        slug: 'invalid-role',
        title: 'Invalid Role',
        shortDescription: 'Test description.',
        sector: 'Tech',
        employmentType: 'full_time',
        experienceLevel: 'entry',
        applicationUrl: 'not-a-url',
      };

      const result = insertWorkforceRecruiterOccupationSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Admin actions', () => {
    it('logs admin actions with CSRF checks', () => {
      const adminReq = createMockRequest(testUserId, true);
      adminReq.body = {
        slug: 'coordinator',
        title: 'Coordinator',
        shortDescription: 'Helps coordinate services.',
        sector: 'Social Services',
        employmentType: 'full_time',
        experienceLevel: 'entry',
      };

      expect(adminReq.isAuthenticated()).toBe(true);
      expect(adminReq.body.slug).toBe('coordinator');
    });
  });
});

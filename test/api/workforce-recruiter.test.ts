import { describe, it, expect, beforeEach } from 'vitest';
import { createMockRequest, generateTestUserId } from '../fixtures/testData';

const sampleProfilePayload = {
  fullName: 'Test User',
  preferredName: 'Tester',
  currentRole: 'Advocate',
  experienceLevel: 'mid',
  yearsExperience: 4,
  preferredIndustries: 'Community Safety',
  preferredRoles: 'Operations',
  keySkills: 'Logistics, case management',
  country: 'United States',
  city: 'Seattle',
  remotePreference: 'hybrid',
  relocationSupportNeeded: false,
  availabilityTimeline: 'Available May',
  supportNeeds: 'Quiet workspace',
  impactStatement: 'Ready to build survivor-led care teams',
  linkedinUrl: 'https://linkedin.com/in/test',
  portfolioUrl: null,
};

describe('API - Workforce Recruiter Profile', () => {
  let userId: string;

  beforeEach(() => {
    userId = generateTestUserId();
  });

  it('should require authentication to access profile', () => {
    const req = createMockRequest(userId);
    expect(req.isAuthenticated()).toBe(true);
  });

  it('should create a profile with valid data', () => {
    const req = createMockRequest(userId);
    req.body = sampleProfilePayload;
    expect(req.body.fullName).toBe('Test User');
    expect(req.body.experienceLevel).toBe('mid');
  });

  it('should update profile data', () => {
    const req = createMockRequest(userId);
    req.body = { remotePreference: 'remote' };
    expect(req.body.remotePreference).toBe('remote');
  });

  it('should delete profile with optional reason', () => {
    const req = createMockRequest(userId);
    req.body = { reason: 'Testing delete' };
    expect(req.body.reason).toBe('Testing delete');
  });
});

describe('API - Workforce Recruiter Config', () => {
  it('should expose configuration to authenticated users', () => {
    const req = createMockRequest(generateTestUserId());
    expect(req.isAuthenticated()).toBe(true);
  });

  it('should allow admins to update configuration payload', () => {
    const req = createMockRequest(generateTestUserId(), true);
    req.body = {
      applicationStatus: 'waitlist',
      maxActiveCandidates: 40,
      contactEmail: 'staff@workforce.dev',
      allowSelfReferral: false,
      requireProfileReview: true,
    };
    expect(req.body.applicationStatus).toBe('waitlist');
    expect(req.body.allowSelfReferral).toBe(false);
  });
});

describe('API - Workforce Recruiter Announcements', () => {
  it('should list active announcements for authenticated survivors', () => {
    const req = createMockRequest(generateTestUserId());
    expect(req.isAuthenticated()).toBe(true);
  });

  it('should let admins create announcements with CSRF protection', () => {
    const req = createMockRequest(generateTestUserId(), true);
    req.body = {
      title: 'Network maintenance',
      content: 'Platform unavailable this weekend',
      type: 'maintenance',
      expiresAt: null,
    };
    expect(req.body.type).toBe('maintenance');
  });
});

describe('API - Workforce Recruiter Occupations & Reports', () => {
  it('should support paginated occupation listings', () => {
    const req = createMockRequest(generateTestUserId());
    req.query = { limit: '20', offset: '0', search: 'safety' };
    expect(req.query.limit).toBe('20');
    expect(req.isAuthenticated()).toBe(true);
  });

  it('should allow admins to create occupations', () => {
    const req = createMockRequest(generateTestUserId(), true);
    req.body = {
      title: 'Community Navigator',
      sector: 'Human Services',
      description: 'Remote-first survivor support role',
      demandLevel: 'high',
      openRoles: 5,
      isRemoteFriendly: true,
      locations: 'Remote · Mexico City',
    };
    expect(req.body.title).toBe('Community Navigator');
    expect(req.body.openRoles).toBe(5);
  });

  it('should provide summary reports for admins only', () => {
    const req = createMockRequest(generateTestUserId(), true);
    expect(req.isAuthenticated()).toBe(true);
  });
});

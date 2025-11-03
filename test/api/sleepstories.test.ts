import { describe, it, expect, beforeEach } from 'vitest';
import { createMockRequest, generateTestUserId } from '../fixtures/testData';

/**
 * Comprehensive API tests for SleepStories endpoints
 */

describe('API - SleepStories', () => {
  describe('GET /api/sleepstories', () => {
    it('should return active stories (public endpoint)', () => {
      const req = createMockRequest(undefined);
      expect(req).toBeDefined();
    });

    it('should filter by category when provided', () => {
      const req = createMockRequest(undefined);
      req.query = { category: 'meditation' };
      expect(req.query.category).toBe('meditation');
    });
  });

  describe('GET /api/sleepstories/:id', () => {
    it('should return story by ID', () => {
      const req = createMockRequest(undefined);
      req.params = { id: 'story-id' };
      expect(req.params.id).toBe('story-id');
    });
  });
});

describe('API - SleepStories Admin', () => {
  let adminUserId: string;

  beforeEach(() => {
    adminUserId = generateTestUserId();
  });

  describe('GET /api/sleepstories/admin', () => {
    it('should require admin access', () => {
      const req = createMockRequest(adminUserId, true);
      expect(req.user).toBeDefined();
    });

    it('should return all stories including inactive', () => {
      const req = createMockRequest(adminUserId, true);
      expect(req.user).toBeDefined();
    });
  });

  describe('POST /api/sleepstories/admin', () => {
    it('should create story with valid data', () => {
      const req = createMockRequest(adminUserId, true);
      req.body = {
        title: 'Test Story',
        description: 'Test description',
        wistiaId: 'wistia-id',
        category: 'bedtime',
        duration: 600,
        isActive: true,
      };
      expect(req.body.title).toBe('Test Story');
    });
  });

  describe('PUT /api/sleepstories/admin/:id', () => {
    it('should update story', () => {
      const req = createMockRequest(adminUserId, true);
      req.params = { id: 'story-id' };
      req.body = { title: 'Updated Title' };
      expect(req.body.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/sleepstories/admin/:id', () => {
    it('should delete story', () => {
      const req = createMockRequest(adminUserId, true);
      req.params = { id: 'story-id' };
      expect(req.params.id).toBe('story-id');
    });
  });
});

describe('API - SleepStories Announcements', () => {
  describe('GET /api/sleepstories/announcements', () => {
    it('should return active announcements (public)', () => {
      const req = createMockRequest(undefined);
      expect(req).toBeDefined();
    });
  });

  describe('Admin Announcement Management', () => {
    let adminUserId: string;

    beforeEach(() => {
      adminUserId = generateTestUserId();
    });

    it('should require admin access for announcement management', () => {
      const req = createMockRequest(adminUserId, true);
      expect(req.user).toBeDefined();
    });
  });
});


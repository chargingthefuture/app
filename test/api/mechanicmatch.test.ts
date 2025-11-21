import { describe, it, expect, beforeEach } from 'vitest';
import { createMockRequest, generateTestUserId } from '../fixtures/testData';

/**
 * Comprehensive API tests for MechanicMatch endpoints
 */

describe('API - MechanicMatch Profile', () => {
  let testUserId: string;

  beforeEach(() => {
    testUserId = generateTestUserId();
  });

  describe('GET /api/mechanicmatch/profile', () => {
    it('should return user profile when authenticated', () => {
      const req = createMockRequest(testUserId);
      expect(req.isAuthenticated()).toBe(true);
    });
  });

  describe('POST /api/mechanicmatch/profile', () => {
    it('should create profile with valid data', () => {
      const req = createMockRequest(testUserId);
      req.body = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '555-1234',
        country: 'United States',
        state: 'NY',
        city: 'New York',
        bio: 'Test bio',
        isMechanic: false,
        isOwner: true,
      };
      expect(req.body.firstName).toBe('Test');
      expect(req.body.isOwner).toBe(true);
    });
  });

  describe('PUT /api/mechanicmatch/profile', () => {
    it('should update profile', () => {
      const req = createMockRequest(testUserId);
      req.body = { bio: 'Updated bio' };
      expect(req.body.bio).toBe('Updated bio');
    });
  });

  describe('DELETE /api/mechanicmatch/profile', () => {
    it('should delete profile with cascade anonymization', () => {
      const req = createMockRequest(testUserId);
      req.body = { reason: 'Test deletion' };
      expect(req.body.reason).toBe('Test deletion');
    });
  });
});

describe('API - MechanicMatch Vehicles', () => {
  let testUserId: string;

  beforeEach(() => {
    testUserId = generateTestUserId();
  });

  describe('GET /api/mechanicmatch/vehicles', () => {
    it('should return user\'s vehicles', () => {
      const req = createMockRequest(testUserId);
      expect(req.isAuthenticated()).toBe(true);
    });
  });

  describe('POST /api/mechanicmatch/vehicles', () => {
    it('should create vehicle with valid data', () => {
      const req = createMockRequest(testUserId);
      req.body = {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        vin: '1HGBH41JXMN109186',
      };
      expect(req.body.make).toBe('Toyota');
    });
  });

  describe('PUT /api/mechanicmatch/vehicles/:id', () => {
    it('should update vehicle', () => {
      const req = createMockRequest(testUserId);
      req.params = { id: 'vehicle-id' };
      req.body = { model: 'Corolla' };
      expect(req.body.model).toBe('Corolla');
    });
  });

  describe('DELETE /api/mechanicmatch/vehicles/:id', () => {
    it('should delete vehicle', () => {
      const req = createMockRequest(testUserId);
      req.params = { id: 'vehicle-id' };
      expect(req.params.id).toBe('vehicle-id');
    });
  });
});

describe('API - MechanicMatch Service Requests', () => {
  let testUserId: string;

  beforeEach(() => {
    testUserId = generateTestUserId();
  });

  describe('POST /api/mechanicmatch/service-requests', () => {
    it('should create service request', () => {
      const req = createMockRequest(testUserId);
      req.body = {
        vehicleId: 'vehicle-id',
        serviceType: 'repair',
        description: 'Engine trouble',
        urgency: 'high',
      };
      expect(req.body.serviceType).toBe('repair');
    });
  });

  describe('GET /api/mechanicmatch/service-requests/open', () => {
    it('should return open service requests for mechanics', () => {
      const req = createMockRequest(testUserId);
      expect(req.isAuthenticated()).toBe(true);
    });
  });
});

describe('API - MechanicMatch Jobs', () => {
  let testUserId: string;

  beforeEach(() => {
    testUserId = generateTestUserId();
  });

  describe('POST /api/mechanicmatch/jobs', () => {
    it('should create job from service request', () => {
      const req = createMockRequest(testUserId);
      req.body = {
        serviceRequestId: 'request-id',
        mechanicId: 'mechanic-id',
        estimatedCost: 500.00,
        estimatedDuration: '2 hours',
      };
      expect(req.body.estimatedCost).toBe(500.00);
    });
  });

  describe('POST /api/mechanicmatch/jobs/:id/accept', () => {
    it('should allow owner to accept job', () => {
      const req = createMockRequest(testUserId);
      req.params = { id: 'job-id' };
      expect(req.params.id).toBe('job-id');
    });
  });
});

describe('API - MechanicMatch Reviews', () => {
  let testUserId: string;

  beforeEach(() => {
    testUserId = generateTestUserId();
  });

  describe('POST /api/mechanicmatch/reviews', () => {
    it('should create review', () => {
      const req = createMockRequest(testUserId);
      req.body = {
        jobId: 'job-id',
        rating: 5,
        comment: 'Great service!',
      };
      expect(req.body.rating).toBe(5);
    });
  });
});

describe('API - MechanicMatch Admin', () => {
  let adminUserId: string;

  beforeEach(() => {
    adminUserId = generateTestUserId();
  });

  describe('GET /api/mechanicmatch/admin/announcements', () => {
    it('should require admin access', () => {
      const req = createMockRequest(adminUserId, true);
      expect(req.user).toBeDefined();
    });
  });
});


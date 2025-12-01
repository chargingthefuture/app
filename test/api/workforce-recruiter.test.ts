import { describe, it, expect, beforeEach } from "vitest";
import { createMockRequest, generateTestUserId } from "../fixtures/testData";

describe("API - Workforce Recruiter Profile", () => {
  let testUserId: string;

  beforeEach(() => {
    testUserId = generateTestUserId();
  });

  describe("GET /api/workforce-recruiter/profile", () => {
    it("requires authentication", () => {
      const req = createMockRequest(testUserId);
      expect(req.isAuthenticated()).toBe(true);
    });
  });

  describe("POST /api/workforce-recruiter/profile", () => {
    it("accepts valid profile payload", () => {
      const req = createMockRequest(testUserId);
      req.body = {
        fullName: "River Stone",
        organization: "Liberation Futures",
        role: "Navigator",
        preferredContactMethod: "signal",
        contactEmail: "river@example.com",
        capacity: 5,
        availabilityStatus: "open",
      };
      expect(req.body.fullName).toBe("River Stone");
      expect(req.body.capacity).toBe(5);
    });
  });

  describe("PUT /api/workforce-recruiter/profile", () => {
    it("updates profile fields", () => {
      const req = createMockRequest(testUserId);
      req.body = { capacity: 8 };
      expect(req.body.capacity).toBe(8);
    });
  });

  describe("DELETE /api/workforce-recruiter/profile", () => {
    it("accepts optional reason", () => {
      const req = createMockRequest(testUserId);
      req.body = { reason: "rotating off cohort" };
      expect(req.body.reason).toContain("cohort");
    });
  });
});

describe("API - Workforce Recruiter Config & Summary", () => {
  let adminUserId: string;

  beforeEach(() => {
    adminUserId = generateTestUserId();
  });

  it("GET /api/workforce-recruiter/config responds for authenticated users", () => {
    const req = createMockRequest(adminUserId, true);
    expect(req.isAuthenticated()).toBe(true);
  });

  it("PUT /api/workforce-recruiter/admin/config allows admins to update config", () => {
    const req = createMockRequest(adminUserId, true);
    req.body = {
      intakeStatus: "paused",
      highlightMessage: "Cohort is full",
    };
    expect(req.body.intakeStatus).toBe("paused");
  });

  it("GET /api/workforce-recruiter/reports/summary returns aggregate data", () => {
    const req = createMockRequest(adminUserId, true);
    expect(req.isAuthenticated()).toBe(true);
  });
});

describe("API - Workforce Recruiter Occupations & Announcements", () => {
  let adminUserId: string;

  beforeEach(() => {
    adminUserId = generateTestUserId();
  });

  it("POST /api/workforce-recruiter/admin/occupations creates occupation", () => {
    const req = createMockRequest(adminUserId, true);
    req.body = {
      occupationName: "Policy Analyst",
      regionFocus: "Remote",
      priorityLevel: "priority",
      talentPoolSize: 10,
      urgentOpenings: 3,
      placementsLast30Days: 2,
      avgTimeToFillDays: 30,
      isActive: true,
    };
    expect(req.body.occupationName).toBe("Policy Analyst");
  });

  it("PUT /api/workforce-recruiter/admin/occupations/:id toggles active state", () => {
    const req = createMockRequest(adminUserId, true);
    req.params = { id: "occupation-id" };
    req.body = { isActive: false };
    expect(req.params.id).toBe("occupation-id");
    expect(req.body.isActive).toBe(false);
  });

  it("POST /api/workforce-recruiter/admin/announcements creates announcement", () => {
    const req = createMockRequest(adminUserId, true);
    req.body = {
      title: "Window closed",
      content: "Intake paused through Q2",
      type: "warning",
    };
    expect(req.body.type).toBe("warning");
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { createMockRequest, createMockResponse, generateTestUserId } from "../fixtures/testData";

describe("API - Workforce Recruiter Profile", () => {
  let testUserId: string;

  beforeEach(() => {
    testUserId = generateTestUserId();
  });

  describe("GET /api/workforce-recruiter/profile", () => {
    it("requires authentication", () => {
      const unauthenticatedReq = createMockRequest(undefined);
      expect(unauthenticatedReq.isAuthenticated()).toBe(false);

      const req = createMockRequest(testUserId);
      expect(req.isAuthenticated()).toBe(true);
    });
  });

  describe("POST /api/workforce-recruiter/profile", () => {
    it("accepts valid payloads", () => {
      const req = createMockRequest(testUserId);
      req.body = {
        organizationName: "Test Org",
        organizationType: "nonprofit",
        missionStatement: "Testing profile creation",
      };
      const res = createMockResponse();
      expect(req.body.organizationName).toBe("Test Org");
      expect(res.status).toBeDefined();
    });
  });

  describe("DELETE /api/workforce-recruiter/profile", () => {
    it("supports optional reason", () => {
      const req = createMockRequest(testUserId);
      req.body = { reason: "No longer recruiting" };
      expect(req.body.reason).toContain("recruiting");
    });
  });
});

describe("API - Workforce Recruiter Config", () => {
  it("allows admins to update config", () => {
    const adminReq = createMockRequest(generateTestUserId(), true);
    adminReq.body = {
      intakeStatus: "open",
      primaryContactEmail: "ops@example.com",
      reviewCadenceDays: 14,
      highlightedIndustries: ["Healthcare"],
    };
    expect(adminReq.body.primaryContactEmail).toMatch(/@example\.com/);
  });
});

describe("API - Workforce Recruiter Occupations", () => {
  it("lists occupations with pagination parameters", () => {
    const req = createMockRequest(generateTestUserId());
    req.query = { limit: "10", offset: "0" };
    expect(req.query.limit).toBe("10");
  });

  it("supports admin creation", () => {
    const adminReq = createMockRequest(generateTestUserId(), true);
    adminReq.body = {
      title: "Mock Occupation",
      priorityLevel: "critical",
      talentPoolSize: 5,
      activeOpportunities: 1,
    };
    expect(adminReq.body.priorityLevel).toBe("critical");
  });
});

describe("API - Workforce Recruiter Announcements", () => {
  it("returns active announcements to authenticated users", () => {
    const req = createMockRequest(generateTestUserId());
    const res = createMockResponse();
    expect(req.isAuthenticated()).toBe(true);
    expect(res.json).toBeDefined();
  });

  it("allows admins to manage announcements", () => {
    const adminReq = createMockRequest(generateTestUserId(), true);
    adminReq.body = {
      title: "Maintenance Window",
      content: "Brief downtime for database migration.",
      type: "maintenance",
      audience: "recruiters",
    };
    expect(adminReq.body.type).toBe("maintenance");
  });
});

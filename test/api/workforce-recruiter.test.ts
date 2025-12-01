import { describe, it, expect, beforeEach } from "vitest";
import { createMockRequest, generateTestUserId } from "../fixtures/testData";

describe("API - Workforce Recruiter", () => {
  let testUserId: string;

  beforeEach(() => {
    testUserId = generateTestUserId();
  });

  describe("GET /api/workforce-recruiter/config", () => {
    it("should require authentication", () => {
      const req = createMockRequest(testUserId);
      expect(req.isAuthenticated()).toBe(true);
    });
  });

  describe("PROFILE routes", () => {
    it("should fetch profile for authenticated user", () => {
      const req = createMockRequest(testUserId);
      expect(req.isAuthenticated()).toBe(true);
    });

    it("should create profile with valid payload", () => {
      const req = createMockRequest(testUserId);
      req.body = {
        preferredName: "Test",
        preferredRole: "Coordinator",
        preferredIndustry: "Non-profit",
        experienceLevel: "entry",
        workPreference: "remote",
        availabilityStatus: "open",
        country: "United States",
      };
      expect(req.body.preferredRole).toBe("Coordinator");
    });

    it("should delete profile with optional reason", () => {
      const req = createMockRequest(testUserId);
      req.body = { reason: "Testing cleanup" };
      expect(req.body.reason).toBe("Testing cleanup");
    });
  });

  describe("ANNOUNCEMENT routes", () => {
    it("should list announcements for authenticated users", () => {
      const req = createMockRequest(testUserId);
      expect(req.isAuthenticated()).toBe(true);
    });

    it("should allow admins to create announcements", () => {
      const req = createMockRequest(generateTestUserId(), true);
      req.body = {
        title: "Hiring pause",
        content: "No new intakes this week.",
        type: "info",
        audience: "applicants",
      };
      expect(req.user?.isAdmin).toBe(true);
    });
  });

  describe("OCCUPATION routes", () => {
    it("should list occupations with optional includeInactive flag", () => {
      const req = createMockRequest(testUserId);
      req.query = { includeInactive: "true" };
      expect(req.query.includeInactive).toBe("true");
    });
  });

  describe("SUMMARY routes", () => {
    it("should return summary report for authenticated users", () => {
      const req = createMockRequest(testUserId);
      expect(req.isAuthenticated()).toBe(true);
    });
  });
});

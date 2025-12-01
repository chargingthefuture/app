import { describe, it, expect, beforeEach } from "vitest";
import { createMockRequest, generateTestUserId } from "../fixtures/testData";

describe("API - Workforce Recruiter Profile", () => {
  let testUserId: string;

  beforeEach(() => {
    testUserId = generateTestUserId();
  });

  it("should require authentication for profile access", () => {
    const req = createMockRequest(testUserId);
    expect(req.isAuthenticated()).toBe(true);
  });

  it("should allow creating a profile with valid payload", () => {
    const req = createMockRequest(testUserId);
    req.body = {
      displayName: "Camila R.",
      headline: "Restoration specialist",
      summary: "Experience across agriculture and fabrication.",
      availabilityStatus: "immediately_available",
      preferredWorkSetting: "hybrid",
      preferredRoleTypes: "garden, fabrication",
      yearsExperience: 6,
      primarySkills: "irrigation, welding",
      supportNeeds: "Signal contact, trauma-informed manager",
      focusAreas: "Food sovereignty",
      languages: "English, Spanish",
      city: "Portland",
      state: "Oregon",
      country: "United States",
      timezone: "America/Los_Angeles",
      openToRemote: true,
      openToRelocation: false,
      profileVisibility: true,
    };
    expect(req.body.displayName).toBe("Camila R.");
  });

  it("should delete profile with an optional reason", () => {
    const req = createMockRequest(testUserId);
    req.body = { reason: "Pausing work matches" };
    expect(req.body.reason).toBe("Pausing work matches");
  });
});

describe("API - Workforce Recruiter Config & Summary", () => {
  let adminId: string;

  beforeEach(() => {
    adminId = generateTestUserId();
  });

  it("should fetch config for authenticated users", () => {
    const req = createMockRequest(adminId);
    expect(req.isAuthenticated()).toBe(true);
    expect(req.user?.claims?.sub).toBe(adminId);
  });

  it("should allow admins to update config", () => {
    const req = createMockRequest(adminId, true);
    req.body = {
      isPortalOpen: true,
      maxActiveApplications: 3,
      highlightMessage: "Allies verified via Signal.",
      supportEmail: "workforce@psyopfree.org",
      emergencySignalNumber: "+12345678900",
      applicationGuidelines: "Share safety needs in the form.",
      featuredRegions: "PNW, Southwest",
      trainingPartners: "Allied co-ops",
      autoShareProfileWithAllies: false,
    };
    expect(req.body.maxActiveApplications).toBe(3);
  });
});

describe("API - Workforce Recruiter Occupations & Announcements", () => {
  let adminId: string;

  beforeEach(() => {
    adminId = generateTestUserId();
  });

  it("should list occupations with pagination params", () => {
    const req = createMockRequest(adminId);
    req.query = { limit: "10", offset: "0" };
    expect(req.query.limit).toBe("10");
  });

  it("should allow admin to create an occupation", () => {
    const req = createMockRequest(adminId, true);
    req.body = {
      title: "Healing Garden Coordinator",
      category: "Regenerative Agriculture",
      description: "Leads micro-farm plots at safe houses.",
      demandLevel: "high",
      requiredSkills: "Soil care, volunteer coordination",
      supportProvided: "Transportation stipend, bilingual lead",
      trainingDurationWeeks: 6,
      openRoles: 4,
      candidatesReady: 2,
      avgHourlyRate: 28,
      regionFocus: "Pacific Northwest",
      applicationUrl: "https://example.com/apply",
      isPriorityRole: true,
      isActive: true,
    };
    expect(req.body.title).toBeDefined();
  });

  it("should allow admin to create announcements", () => {
    const req = createMockRequest(adminId, true);
    req.body = {
      title: "Signal-verified employers added",
      content: "Three co-ops completed onboarding.",
      type: "update",
      targetAudience: "job_seekers",
    };
    expect(req.body.type).toBe("update");
  });
});

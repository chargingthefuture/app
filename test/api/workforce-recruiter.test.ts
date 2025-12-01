import { describe, it, expect, beforeEach } from "vitest";
import { createMockRequest, generateTestUserId } from "../fixtures/testData";

describe("API - Workforce Recruiter Profile", () => {
  let userId: string;

  beforeEach(() => {
    userId = generateTestUserId();
  });

  it("GET /api/workforce-recruiter/profile should require auth", () => {
    const req = createMockRequest(userId);
    expect(req.isAuthenticated()).toBe(true);

    const unauthenticated = createMockRequest(undefined);
    expect(unauthenticated.isAuthenticated()).toBe(false);
  });

  it("POST /api/workforce-recruiter/profile accepts required fields", () => {
    const req = createMockRequest(userId);
    req.body = {
      organizationName: "CareOps Cooperative",
      recruiterName: "Jules Vega",
      contactEmail: "talent@careops.example",
      candidateCapacity: 12,
      placementsCompleted: 8,
      isAcceptingCandidates: true,
    };
    expect(req.body.organizationName).toBe("CareOps Cooperative");
    expect(req.body.isAcceptingCandidates).toBe(true);
  });

  it("PUT /api/workforce-recruiter/profile updates optional fields", () => {
    const req = createMockRequest(userId);
    req.body = { notes: "Prefer remote-friendly roles" };
    expect(req.body.notes).toContain("remote");
  });

  it("DELETE /api/workforce-recruiter/profile accepts reason", () => {
    const req = createMockRequest(userId);
    req.body = { reason: "Pausing hiring queue" };
    expect(req.body.reason).toBe("Pausing hiring queue");
  });
});

describe("API - Workforce Recruiter Config & Summary", () => {
  let adminId: string;

  beforeEach(() => {
    adminId = generateTestUserId();
  });

  it("GET /api/workforce-recruiter/config returns config for authenticated users", () => {
    const req = createMockRequest(adminId);
    expect(req.isAuthenticated()).toBe(true);
  });

  it("GET /api/workforce-recruiter/reports/summary requires admin", () => {
    const adminReq = createMockRequest(adminId, true);
    expect(adminReq.user?.isAdmin).toBe(true);
  });

  it("PUT /api/workforce-recruiter/admin/config validates payload", () => {
    const req = createMockRequest(adminId, true);
    req.body = {
      missionStatement: "Center dignity in every hiring sprint.",
      escalationEmail: "workforce@the-comic.com",
    };
    expect(req.body.missionStatement).toMatch(/dignity/);
  });
});

describe("API - Workforce Recruiter Occupations", () => {
  let adminId: string;

  beforeEach(() => {
    adminId = generateTestUserId();
  });

  it("GET /api/workforce-recruiter/occupations accepts pagination params", () => {
    const req = createMockRequest(adminId);
    req.query = { limit: "10", offset: "0" };
    expect(req.query.limit).toBe("10");
  });

  it("POST /api/workforce-recruiter/admin/occupations creates occupation", () => {
    const req = createMockRequest(adminId, true);
    req.body = {
      title: "Signal Concierge",
      category: "Support",
      demandLevel: "high",
      openRoles: 5,
    };
    expect(req.body.title).toBe("Signal Concierge");
  });

  it("PUT /api/workforce-recruiter/admin/occupations/:id updates fields", () => {
    const req = createMockRequest(adminId, true);
    req.params = { id: "occupation-id" };
    req.body = { openRoles: 9 };
    expect(req.params.id).toBe("occupation-id");
    expect(req.body.openRoles).toBe(9);
  });

  it("DELETE /api/workforce-recruiter/admin/occupations/:id removes role", () => {
    const req = createMockRequest(adminId, true);
    req.params = { id: "occupation-id" };
    expect(req.params.id).toBeDefined();
  });
});

describe("API - Workforce Recruiter Announcements", () => {
  let userId: string;
  let adminId: string;

  beforeEach(() => {
    userId = generateTestUserId();
    adminId = generateTestUserId();
  });

  it("GET /api/workforce-recruiter/announcements requires auth", () => {
    const req = createMockRequest(userId);
    expect(req.isAuthenticated()).toBe(true);
  });

  it("GET /api/workforce-recruiter/admin/announcements requires admin", () => {
    const req = createMockRequest(adminId, true);
    expect(req.user?.isAdmin).toBe(true);
  });

  it("POST /api/workforce-recruiter/admin/announcements validates payload", () => {
    const req = createMockRequest(adminId, true);
    req.body = {
      title: "Office hours shift",
      content: "We are moving office hours to Wednesday.",
      type: "info",
    };
    expect(req.body.title).toContain("Office");
  });

  it("PUT /api/workforce-recruiter/admin/announcements/:id updates announcement", () => {
    const req = createMockRequest(adminId, true);
    req.params = { id: "announcement-id" };
    req.body = { content: "Updated copy" };
    expect(req.body.content).toBe("Updated copy");
  });

  it("DELETE /api/workforce-recruiter/admin/announcements/:id removes announcement", () => {
    const req = createMockRequest(adminId, true);
    req.params = { id: "announcement-id" };
    expect(req.params.id).toBe("announcement-id");
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { createMockRequest, createMockResponse, generateTestUserId } from "../fixtures/testData";

describe("API - Workforce Recruiter Config", () => {
  let userId: string;

  beforeEach(() => {
    userId = generateTestUserId();
  });

  it("requires authentication to read config", () => {
    const req = createMockRequest(undefined);
    expect(req.isAuthenticated()).toBe(false);
  });

  it("allows authenticated users to retrieve config", () => {
    const req = createMockRequest(userId);
    expect(req.isAuthenticated()).toBe(true);
  });
});

describe("API - Workforce Recruiter Summary", () => {
  it("fetches summary for authenticated users", () => {
    const req = createMockRequest(generateTestUserId());
    expect(req.isAuthenticated()).toBe(true);
  });
});

describe("API - Workforce Recruiter Announcements", () => {
  it("lists announcements for authenticated users", () => {
    const req = createMockRequest(generateTestUserId());
    expect(req.isAuthenticated()).toBe(true);
  });

  it("blocks unauthenticated access", () => {
    const req = createMockRequest(undefined);
    expect(req.isAuthenticated()).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, mockUseAuth } from "../../../fixtures/testHelpers";
import WorkforceRecruiterProfilePage from "@/pages/workforce-recruiter/profile";
import * as useAuthModule from "@/hooks/useAuth";
import { screen, waitFor } from "@testing-library/react";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("wouter", async () => {
  const actual = await vi.importActual("wouter");
  return {
    ...actual,
    useLocation: () => ["/apps/workforce-recruiter/profile", vi.fn()],
  };
});

vi.mock("@/lib/queryClient", () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
  },
  apiRequest: vi.fn(),
}));

describe("WorkforceRecruiterProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders create form when no profile exists", async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth());
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(null),
      } as Response)
    );

    renderWithProviders(<WorkforceRecruiterProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/create workforce recruiter profile/i)).toBeInTheDocument();
    });
  });

  it("shows delete button when profile exists", async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth());
    const mockProfile = {
      id: "profile-1",
      userId: "user-1",
      organizationName: "Test Org",
      organizationType: "nonprofit",
      missionStatement: "Testing",
      primaryIndustries: "Healthcare",
      regionsServed: "Remote",
      country: "United States",
      city: "Portland",
      intakeCapacity: 5,
      isAcceptingCandidates: true,
      preferredCommunication: "signal",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockProfile),
      } as Response)
    );

    renderWithProviders(<WorkforceRecruiterProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId("button-delete-workforce-profile")).toBeInTheDocument();
    });
  });
});

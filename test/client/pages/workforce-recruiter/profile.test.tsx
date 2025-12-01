import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import WorkforceRecruiterProfile from "@/pages/workforce-recruiter/profile";
import { renderWithProviders, mockUseAuth } from "../../fixtures/testHelpers";
import * as useAuthModule from "@/hooks/useAuth";

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

describe("WorkforceRecruiterProfile", () => {
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

    renderWithProviders(<WorkforceRecruiterProfile />);

    await waitFor(() => {
      expect(screen.getByText(/create workforce recruiter profile/i)).toBeInTheDocument();
    });
  });

  it("shows delete button when profile exists", async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth());

    const profile = {
      id: "test-profile",
      userId: "user-1",
      displayName: "Camila R.",
      headline: "Restoration specialist",
      summary: "Experience across agriculture and fabrication.",
      availabilityStatus: "immediately_available",
      preferredWorkSetting: "hybrid",
      preferredRoleTypes: "garden, fabrication",
      yearsExperience: 5,
      primarySkills: "irrigation",
      supportNeeds: "",
      focusAreas: "",
      languages: "English",
      city: "Portland",
      state: "Oregon",
      country: "United States",
      timezone: "America/Los_Angeles",
      openToRemote: true,
      openToRelocation: false,
      profileVisibility: true,
      highlightedIndustries: "",
      resumeUrl: "",
      portfolioUrl: "",
      signalUrl: "",
      safetyNotes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(profile),
      } as Response)
    );

    render(<WorkforceRecruiterProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("button-delete-profile")).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import WorkforceRecruiterProfilePage from "@/pages/workforce-recruiter/profile";
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

describe("WorkforceRecruiterProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders create form when profile does not exist", async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth());

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(null),
        ok: true,
      } as Response),
    );

    renderWithProviders(<WorkforceRecruiterProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/create profile/i)).toBeInTheDocument();
    });
  });

  it("shows delete button when profile exists", async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth());

    const mockProfile = {
      id: "test",
      userId: "user",
      preferredName: "Tester",
      preferredRole: "Coordinator",
      preferredIndustry: "Non-profit",
      experienceLevel: "entry",
      workPreference: "remote",
      availabilityStatus: "open",
      country: "United States",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockProfile),
        ok: true,
      } as Response),
    );

    render(<WorkforceRecruiterProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId("button-delete-profile")).toBeInTheDocument();
    });
  });
});

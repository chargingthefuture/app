import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
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

  it("renders edit form when profile exists", async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth());
    const mockProfile = {
      id: "profile-id",
      userId: "user-1",
      fullName: "River Stone",
      organization: "Liberation Futures",
      role: "Navigator",
      preferredContactMethod: "signal",
      contactEmail: "river@example.com",
      capacity: 5,
      availabilityStatus: "open",
      acceptsInternational: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockProfile),
      } as Response)
    );

    renderWithProviders(<WorkforceRecruiterProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("button-submit")).toHaveTextContent(/update profile/i);
    });
  });

  it("shows delete button when profile exists", async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth());
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            id: "profile-id",
            userId: "user-1",
            fullName: "River Stone",
            organization: "Liberation Futures",
            role: "Navigator",
            preferredContactMethod: "signal",
            contactEmail: "river@example.com",
            capacity: 5,
            availabilityStatus: "open",
            acceptsInternational: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
      } as Response)
    );

    renderWithProviders(<WorkforceRecruiterProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("button-delete-profile")).toBeInTheDocument();
    });
  });
});

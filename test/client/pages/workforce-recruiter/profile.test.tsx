import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { renderWithProviders, mockUseAuth } from "../../../fixtures/testHelpers";
import WorkforceRecruiterProfile from "@/pages/workforce-recruiter/profile";
import * as useAuthModule from "@/hooks/useAuth";

const resizeObserverMock = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver || resizeObserverMock;

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

vi.mock("@/lib/queryClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/queryClient")>(
    "@/lib/queryClient"
  );
  return {
    ...actual,
    queryClient: {
      invalidateQueries: vi.fn(),
    },
    apiRequest: vi.fn(),
  };
});

const mockFetchResponse = (payload: any) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(payload),
  } as Response);

describe("WorkforceRecruiterProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders create form when no profile exists", async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth());

    global.fetch = vi.fn(() => mockFetchResponse(null));

    renderWithProviders(<WorkforceRecruiterProfile />);

    await waitFor(() => {
      expect(screen.getByText(/create workforce profile/i)).toBeInTheDocument();
      expect(screen.getByTestId("button-save-workforce-profile")).toHaveTextContent(/create/i);
    });
  });

  it("renders edit view when profile exists", async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth());

    const mockProfile = {
      id: "profile-id",
      userId: "user-123",
      organizationName: "Signal Concierge Coop",
      recruiterName: "Marin A.",
      contactEmail: "talent@signalcoop.example",
      candidateCapacity: 10,
      placementsCompleted: 5,
      isAcceptingCandidates: true,
      verificationStatus: "approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    global.fetch = vi.fn(() => mockFetchResponse(mockProfile));

    renderWithProviders(<WorkforceRecruiterProfile />);

    await waitFor(() => {
      expect(screen.getByText(/update workforce profile/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/signal concierge coop/i)).toBeInTheDocument();
      expect(screen.getByTestId("button-delete-workforce-profile")).toBeInTheDocument();
    });
  });

  it("does not show delete button when profile is missing", async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth());

    global.fetch = vi.fn(() => mockFetchResponse(null));

    renderWithProviders(<WorkforceRecruiterProfile />);

    await waitFor(() => {
      expect(screen.queryByTestId("button-delete-workforce-profile")).not.toBeInTheDocument();
    });
  });
});

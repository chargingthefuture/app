import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import InviteRequired from '@/pages/invite-required';
import { renderWithProviders, mockUseAuth } from '../fixtures/testHelpers';
import * as useAuthModule from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    useLocation: () => ['/invite-required', vi.fn()],
  };
});

vi.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
  },
  apiRequest: vi.fn(),
}));

describe('InviteRequired', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render invite required page', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(
      mockUseAuth({ user: { id: 'test-user', inviteCodeUsed: null } })
    );

    renderWithProviders(<InviteRequired />);

    await waitFor(() => {
      expect(screen.getByText(/invite.*code/i)).toBeInTheDocument();
    });
  });

  it('should display invite code input form', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(
      mockUseAuth({ user: { id: 'test-user', inviteCodeUsed: null } })
    );

    renderWithProviders(<InviteRequired />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter.*invite.*code/i)).toBeInTheDocument();
    });
  });
});


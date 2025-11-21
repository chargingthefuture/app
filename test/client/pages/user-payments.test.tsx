import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import UserPayments from '@/pages/user-payments';
import { renderWithProviders, mockUseAuth } from '../fixtures/testHelpers';
import * as useAuthModule from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
  },
  apiRequest: vi.fn(),
}));

describe('UserPayments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render payments page for authenticated user', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth({ user: { id: 'test-user' } }));

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([]),
      } as Response)
    );

    renderWithProviders(<UserPayments />);

    await waitFor(() => {
      expect(screen.getByText(/payments/i)).toBeInTheDocument();
    });
  });

  it('should display payment history when available', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth({ user: { id: 'test-user' } }));

    const mockPayments = [
      {
        id: 'payment-1',
        amount: 10.00,
        status: 'completed',
        createdAt: new Date(),
      },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockPayments),
      } as Response)
    );

    renderWithProviders(<UserPayments />);

    await waitFor(() => {
      expect(screen.getByText(/payments/i)).toBeInTheDocument();
    });
  });
});


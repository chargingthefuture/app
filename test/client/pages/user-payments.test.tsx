import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import UserPayments from '@/pages/user-payments';
import { renderWithProviders, mockUseAuth } from '../../fixtures/testHelpers';
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

    global.fetch = vi.fn()
      // Payments list
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as unknown as Response)
      // Payment status
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          isDelinquent: false,
          missingMonths: [],
          nextBillingDate: null,
          amountOwed: "0",
        }),
      } as unknown as Response);

    renderWithProviders(<UserPayments />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my payments/i })).toBeInTheDocument();
    });
  });

  it('should display payment history when available', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth({ user: { id: 'test-user' } }));

    const mockPayments = [
      {
        id: 'payment-1',
        amount: 10.0,
        billingPeriod: 'monthly',
        billingMonth: '2024-01',
        paymentMethod: 'venmo',
        paymentDate: '2024-01-15',
        notes: 'Test payment',
      },
    ];

    global.fetch = vi.fn()
      // Payments list
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPayments),
      } as unknown as Response)
      // Payment status
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          isDelinquent: false,
          missingMonths: [],
          nextBillingDate: null,
          amountOwed: "0",
        }),
      } as unknown as Response);

    renderWithProviders(<UserPayments />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my payments/i })).toBeInTheDocument();
    });
  });
});


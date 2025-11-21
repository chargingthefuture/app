import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import Services from '@/pages/services';
import { renderWithProviders, mockUseAuth } from '../fixtures/testHelpers';
import * as useAuthModule from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render services page', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth({ user: { id: 'test-user' } }));

    renderWithProviders(<Services />);

    await waitFor(() => {
      expect(screen.getByText(/services/i)).toBeInTheDocument();
    });
  });

  it('should display all available mini-apps', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue(mockUseAuth({ user: { id: 'test-user' } }));

    renderWithProviders(<Services />);

    await waitFor(() => {
      // Check for some common mini-app names
      expect(screen.getByText(/supportmatch|directory|lighthouse|socketrelay/i)).toBeInTheDocument();
    });
  });
});


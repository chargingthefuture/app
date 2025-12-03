import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock Clerk hooks
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(),
  useAuth: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should return loading state when Clerk is not loaded', () => {
    const { useUser, useAuth: useClerkAuth } = require('@clerk/clerk-react');
    useUser.mockReturnValue({ isLoaded: false, isSignedIn: false, user: null });
    useClerkAuth.mockReturnValue({ isSignedIn: false });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should return authenticated state when user is signed in', async () => {
    const { useUser, useAuth: useClerkAuth } = require('@clerk/clerk-react');
    const mockClerkUser = { id: 'clerk-user-id', email: 'test@example.com' };
    
    useUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: mockClerkUser,
    });
    useClerkAuth.mockReturnValue({ isSignedIn: true });

    const mockDbUser = {
      id: 'db-user-id',
      email: 'test@example.com',
      isAdmin: false,
      isApproved: true,
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockDbUser),
      } as Response)
    );

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.user).toEqual(mockDbUser);
    expect(result.current.isAdmin).toBe(false);
  });

  it('should return admin state when user is admin', async () => {
    const { useUser, useAuth: useClerkAuth } = require('@clerk/clerk-react');
    const mockClerkUser = { id: 'clerk-user-id', email: 'admin@example.com' };
    
    useUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: mockClerkUser,
    });
    useClerkAuth.mockReturnValue({ isSignedIn: true });

    const mockDbUser = {
      id: 'db-user-id',
      email: 'admin@example.com',
      isAdmin: true,
      isApproved: true,
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockDbUser),
      } as Response)
    );

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.isAdmin).toBe(true);
  });

  it('should expose Clerk internals', () => {
    const { useUser, useAuth: useClerkAuth } = require('@clerk/clerk-react');
    useUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: { id: 'clerk-user-id' },
    });
    useClerkAuth.mockReturnValue({ isSignedIn: true });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current._clerk).toBeDefined();
    expect(result.current._clerk.clerkLoaded).toBe(true);
    expect(result.current._clerk.isSignedIn).toBe(true);
    expect(result.current._clerk.clerkUser).toBeDefined();
  });
});


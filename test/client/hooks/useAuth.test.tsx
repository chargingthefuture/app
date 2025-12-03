import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import * as clerkReact from '@clerk/clerk-react';

// Mock Clerk hooks
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(),
  useAuth: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        queryFn: async ({ queryKey }) => {
          const url = queryKey.join("/") as string;
          const res = await fetch(url, {
            credentials: "include",
          });
          if (!res.ok) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }
          return res.json();
        },
      },
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
    const mockUseUser = vi.mocked(clerkReact.useUser);
    const mockUseClerkAuth = vi.mocked(clerkReact.useAuth);
    
    mockUseUser.mockReturnValue({ isLoaded: false, isSignedIn: false, user: null } as any);
    mockUseClerkAuth.mockReturnValue({ isSignedIn: false } as any);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    // When Clerk is not loaded and not timed out, isLoading should be true
    // Based on hook logic: isLoading = (!clerkLoaded && !clerkLoadTimeout) || (clerkLoaded && isSignedIn && dbLoading)
    // Since clerkLoaded is false and clerkLoadTimeout starts as false, isLoading should be true
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should return authenticated state when user is signed in', async () => {
    const mockUseUser = vi.mocked(clerkReact.useUser);
    const mockUseClerkAuth = vi.mocked(clerkReact.useAuth);
    const mockClerkUser = { id: 'clerk-user-id', email: 'test@example.com' };
    
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: mockClerkUser,
    } as any);
    mockUseClerkAuth.mockReturnValue({ isSignedIn: true } as any);

    const mockDbUser = {
      id: 'db-user-id',
      email: 'test@example.com',
      isAdmin: false,
      isApproved: true,
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
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
    const mockUseUser = vi.mocked(clerkReact.useUser);
    const mockUseClerkAuth = vi.mocked(clerkReact.useAuth);
    const mockClerkUser = { id: 'clerk-user-id', email: 'admin@example.com' };
    
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: mockClerkUser,
    } as any);
    mockUseClerkAuth.mockReturnValue({ isSignedIn: true } as any);

    const mockDbUser = {
      id: 'db-user-id',
      email: 'admin@example.com',
      isAdmin: true,
      isApproved: true,
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
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
    const mockUseUser = vi.mocked(clerkReact.useUser);
    const mockUseClerkAuth = vi.mocked(clerkReact.useAuth);
    
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: { id: 'clerk-user-id' },
    } as any);
    mockUseClerkAuth.mockReturnValue({ isSignedIn: true } as any);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current._clerk).toBeDefined();
    expect(result.current._clerk.clerkLoaded).toBe(true);
    expect(result.current._clerk.isSignedIn).toBe(true);
    expect(result.current._clerk.clerkUser).toBeDefined();
  });
});


import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Test helpers for React components
 */

/**
 * Create a test QueryClient with disabled retries
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Provide a no-op default query function so components using a queryKey
        // without specifying queryFn don't warn or throw in tests.
        queryFn: async () => null,
        retry: false,
        refetchOnWindowFocus: false,
        refetchInterval: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock useAuth hook
export const mockUseAuth = (overrides = {}) => {
  const defaultClerk = {
    isSignedIn: false,
    clerkLoaded: false,
    clerkUser: null,
    clerkError: null,
  };

  // Extract _clerk from overrides if present, otherwise use default
  const clerkOverrides = overrides._clerk || {};
  const finalClerk = { ...defaultClerk, ...clerkOverrides };

  const merged = {
    user: null,
    isAdmin: false,
    isAuthenticated: undefined as boolean | undefined,
    isLoading: false,
    _clerk: finalClerk,
    _dbError: null,
    ...overrides,
    // Ensure _clerk is always defined (overwrite any undefined/null from overrides)
    _clerk: finalClerk,
  };

  // If isAuthenticated wasn't explicitly provided, derive it from the presence of a user.
  if (merged.isAuthenticated === undefined) {
    merged.isAuthenticated = Boolean(merged.user);
  }

  // Keep Clerk's isSignedIn in sync with authentication state when not explicitly set.
  if (merged._clerk && merged._clerk.isSignedIn === false && merged.isAuthenticated) {
    merged._clerk = { ...merged._clerk, isSignedIn: true };
  }

  return merged;
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));


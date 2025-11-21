import { useUser as useClerkUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import type { User as DbUser } from "@shared/schema";

/**
 * useAuth
 * - Returns the combined auth state from Clerk and the app DB user.
 * - Starts DB fetch only when Clerk is loaded and reports signed-in.
 */
export function useAuth() {
  // read Clerk hook values directly (no try/catch)
  const clerkUserHook = useClerkUser();
  const clerkAuthHook = useClerkAuth();

  // clerkUserHook shape: { isLoaded, isSignedIn, user }
  const clerkLoaded = Boolean((clerkUserHook as any).isLoaded);
  const isSignedIn = Boolean((clerkUserHook as any).isSignedIn || (clerkAuthHook as any).isSignedIn);
  const clerkUser = (clerkUserHook as any).user ?? null;

  const { data: dbUser, isLoading: dbLoading } = useQuery<DbUser | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: clerkLoaded && isSignedIn,
  });

  // isLoading: only true when Clerk loaded and db fetch is in progress.
  const isLoading = clerkLoaded ? (isSignedIn ? Boolean(dbLoading) : false) : false;

  const isAuthenticated = isSignedIn && Boolean(clerkUser);
  const user = isAuthenticated && dbUser ? dbUser : null;

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin: user?.isAdmin ?? false,
    // expose Clerk internals if needed by callers
    _clerk: {
      clerkLoaded,
      isSignedIn,
      clerkUser,
    },
  } as const;
}

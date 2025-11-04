import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  // Always call hooks (rules of hooks), but handle errors gracefully
  let clerkUser, clerkLoaded, isSignedIn;
  
  try {
    const userResult = useUser();
    const authResult = useClerkAuth();
    clerkUser = userResult.user;
    clerkLoaded = userResult.isLoaded;
    isSignedIn = authResult.isSignedIn;
  } catch (error) {
    // If Clerk fails to load (e.g., network error), treat as not authenticated
    // This allows the landing page to load even if Clerk has connection issues
    clerkUser = null;
    clerkLoaded = true; // Set to true so we don't show loading state
    isSignedIn = false;
  }
  
  // Fetch our database user for additional fields (isAdmin, inviteCodeUsed, etc.)
  // Only fetch if Clerk says user is signed in
  const { data: dbUser, isLoading: dbLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: isSignedIn === true && clerkLoaded === true,
  });

  // Don't show loading state if Clerk hasn't loaded yet - just show as not authenticated
  const isLoading = clerkLoaded === false ? false : (isSignedIn === true && dbLoading === true);
  const isAuthenticated = isSignedIn === true && !!clerkUser;
  
  // Combine Clerk user data with our database user data
  const user = isAuthenticated && dbUser ? dbUser : null;

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin: user?.isAdmin || false,
  };
}

import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { isSignedIn } = useClerkAuth();
  
  // Fetch our database user for additional fields (isAdmin, inviteCodeUsed, etc.)
  const { data: dbUser, isLoading: dbLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: isSignedIn && clerkLoaded,
  });

  const isLoading = !clerkLoaded || (isSignedIn && dbLoading);
  const isAuthenticated = isSignedIn && !!clerkUser;
  
  // Combine Clerk user data with our database user data
  const user = isAuthenticated && dbUser ? dbUser : null;

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin: user?.isAdmin || false,
  };
}

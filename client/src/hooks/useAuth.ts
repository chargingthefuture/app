import { useUser as useClerkUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User as DbUser } from "@shared/schema";
import { useEffect, useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

/**
 * useAuth
 * - Returns the combined auth state from Clerk and the app DB user.
 * - Starts DB fetch only when Clerk is loaded and reports signed-in.
 */
export function useAuth() {
  const [clerkError, setClerkError] = useState<string | null>(null);
  const [clerkLoadTimeout, setClerkLoadTimeout] = useState(false);
  const queryClient = useQueryClient();
  const syncRetryCountRef = useRef(0);
  const lastSyncRetryRef = useRef<number>(0);
  
  // Read Clerk hook values - hooks must be called unconditionally
  // If ClerkProvider isn't mounted or fails, these will throw or return undefined
  const clerkUserHook = useClerkUser();
  const clerkAuthHook = useClerkAuth();

  // clerkUserHook shape: { isLoaded, isSignedIn, user }
  // Use optional chaining to safely access properties
  // Check both hooks for isLoaded to ensure we catch the state correctly
  const clerkLoaded = Boolean(
    (clerkUserHook as any)?.isLoaded ?? 
    (clerkAuthHook as any)?.isLoaded ??
    false
  );
  const isSignedIn = Boolean(
    (clerkUserHook as any)?.isSignedIn ?? 
    (clerkAuthHook as any)?.isSignedIn ??
    false
  );
  const clerkUser = (clerkUserHook as any)?.user ?? (clerkAuthHook as any)?.user ?? null;

  // Detect Clerk loading errors and check configuration
  useEffect(() => {
    const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    
    // Check for missing or invalid key first
    if (!clerkKey || clerkKey === 'undefined' || clerkKey.trim() === '') {
      setClerkError("Missing or invalid Clerk publishable key. Please set VITE_CLERK_PUBLISHABLE_KEY environment variable.");
      return;
    }

    // Check if Clerk scripts are loaded
    if (typeof window !== 'undefined') {
      const checkScripts = () => {
        const scripts = Array.from(document.querySelectorAll('script')).filter(
          s => s.src && (s.src.includes('clerk') || s.src.includes('clerk.dev') || s.src.includes('clerk.com'))
        );
        return scripts.length > 0;
      };

      // Initial check
      if (!checkScripts()) {
        // Wait a bit for scripts to load
        const timer = setTimeout(() => {
          if (!checkScripts() && !clerkLoaded) {
            setClerkError("Clerk scripts failed to load. This may indicate a network issue, CORS problem, or invalid publishable key.");
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    }

    // If Clerk is loaded, clear any errors and timeout
    if (clerkLoaded) {
      setClerkError(null);
      setClerkLoadTimeout(false);
    }
  }, [clerkLoaded]);

  // Timeout for Clerk loading - if Clerk doesn't load within 10 seconds, show error
  useEffect(() => {
    if (!clerkLoaded && typeof window !== 'undefined') {
      const timeout = setTimeout(() => {
        setClerkLoadTimeout(true);
        if (!clerkError) {
          setClerkError("Clerk is taking longer than expected to load. Please check your network connection and try refreshing the page.");
        }
      }, 10000); // 10 second timeout
      return () => clearTimeout(timeout);
    }
  }, [clerkLoaded, clerkError]);

  const { data: dbUser, isLoading: dbLoading, error: dbError } = useQuery<DbUser | null>({
    queryKey: ["/api/auth/user"],
    retry: 2, // Retry up to 2 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff
    enabled: clerkLoaded && isSignedIn,
  });

  // Log errors and null responses for debugging
  // Automatically retry sync when sync failure is detected
  useEffect(() => {
    if (dbError) {
      console.error("Error fetching user from database:", dbError);
    }
    // Log when we get null response but user is authenticated with Clerk
    // This indicates a sync failure that needs investigation
    if (clerkLoaded && isSignedIn && !dbLoading && dbUser === null && !dbError) {
      const now = Date.now();
      const timeSinceLastRetry = now - lastSyncRetryRef.current;
      const maxRetries = 3;
      const retryCooldown = 5000; // 5 seconds between retries
      
      // Only retry if we haven't exceeded max retries and enough time has passed
      if (syncRetryCountRef.current < maxRetries && timeSinceLastRetry > retryCooldown) {
        console.warn("User authenticated with Clerk but database returned null. Attempting automatic sync retry...", {
          clerkUserId: clerkUser?.id,
          clerkEmail: clerkUser?.primaryEmailAddress?.emailAddress,
          retryAttempt: syncRetryCountRef.current + 1,
          maxRetries,
          timestamp: new Date().toISOString(),
        });
        
        syncRetryCountRef.current += 1;
        lastSyncRetryRef.current = now;
        
        // Trigger a manual sync by calling the sync endpoint
        apiRequest("POST", "/api/auth/sync", {})
          .then(async (res) => {
            // Check if response is OK
            if (res.ok) {
              try {
                const data = await res.json();
                console.log("Sync retry triggered successfully", {
                  message: data.message,
                  syncDuration: data.syncDuration,
                  hasUser: !!data.user,
                });
                
                // If the sync response includes the user, set it directly in the cache
                // This avoids a race condition where we invalidate and refetch too quickly
                if (data.user) {
                  queryClient.setQueryData(["/api/auth/user"], data.user);
                  console.log("User data set directly from sync response", {
                    userId: data.user.id,
                    email: data.user.email,
                  });
                } else {
                  // If no user in response, wait a bit then invalidate to trigger refetch
                  // This gives the database time to commit the transaction
                  setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                  }, 300);
                }
              } catch (parseError) {
                console.error("Failed to parse sync response:", parseError);
                // Wait a bit then invalidate the query to trigger a refetch
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                }, 300);
              }
            } else {
              // Try to get error message from response
              let errorMessage = `HTTP ${res.status}`;
              try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorMessage;
              } catch {
                // Ignore JSON parse errors
              }
              console.error("Sync retry failed", {
                status: res.status,
                message: errorMessage,
              });
              
              // Even on error, try to refetch after a delay in case the sync partially succeeded
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
              }, 1000);
            }
          })
          .catch((error) => {
            console.error("Failed to trigger sync retry:", {
              error: error.message,
              stack: error.stack,
            });
            // On network error, still try to refetch after a delay
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            }, 1000);
          });
      } else if (syncRetryCountRef.current >= maxRetries) {
        // Log error after max retries exceeded
        console.error("User authenticated with Clerk but database returned null. Max sync retries exceeded.", {
          clerkUserId: clerkUser?.id,
          clerkEmail: clerkUser?.primaryEmailAddress?.emailAddress,
          retryAttempts: syncRetryCountRef.current,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Log the sync failure but don't retry yet (still in cooldown)
        console.error("User authenticated with Clerk but database returned null. This may indicate a sync failure.", {
          clerkUserId: clerkUser?.id,
          clerkEmail: clerkUser?.primaryEmailAddress?.emailAddress,
          retryAttempts: syncRetryCountRef.current,
          timeSinceLastRetry,
          timestamp: new Date().toISOString(),
        });
      }
    }
    
    // Reset retry count when user is successfully loaded
    if (dbUser !== null) {
      syncRetryCountRef.current = 0;
      lastSyncRetryRef.current = 0;
    }
  }, [dbError, dbUser, clerkLoaded, isSignedIn, dbLoading, clerkUser, queryClient]);

  // isLoading: true when:
  // - Clerk is not loaded yet (and not timed out), OR
  // - Clerk is loaded, user is signed in, and we're fetching DB user
  // If there's an error or timeout, don't keep loading forever
  const isLoading = (!clerkLoaded && !clerkLoadTimeout) || (clerkLoaded && isSignedIn && dbLoading);

  const isAuthenticated = isSignedIn && Boolean(clerkUser);
  // If user is authenticated with Clerk but dbUser is null, treat as sync failure
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
      clerkError,
    },
    // expose DB query error for debugging
    _dbError: dbError,
  } as const;
}

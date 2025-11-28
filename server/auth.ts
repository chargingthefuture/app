import { requireAuth } from "@clerk/express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { validateCsrfToken } from "./csrf";
import { withDatabaseErrorHandling } from "./databaseErrorHandler";
import { ExternalServiceError } from "./errors";

// Clerk Configuration
if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("Environment variable CLERK_SECRET_KEY not provided");
}

/**
 * Map Clerk user to our user schema
 */
function mapClerkUser(clerkUser: any) {
  const firstName = clerkUser.firstName || "";
  const lastName = clerkUser.lastName || "";
  const fullName = clerkUser.fullName || "";
  
  // If separate name fields not available, try to split from full name
  const nameParts = fullName.split(" ");
  const parsedFirstName = !firstName && nameParts.length > 0 ? nameParts[0] : firstName;
  const parsedLastName = !lastName && nameParts.length > 1 ? nameParts.slice(1).join(" ") : lastName;

  return {
    sub: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "",
    first_name: parsedFirstName,
    last_name: parsedLastName,
    profile_image_url: clerkUser.imageUrl || null,
  };
}

/**
 * Check if a user account has been deleted
 * Deleted users have: email === null, firstName === "Deleted", lastName === "User"
 */
function isUserDeleted(user: any): boolean {
  return user && 
    user.email === null && 
    user.firstName === "Deleted" && 
    user.lastName === "User";
}

/**
 * Retry helper for transient failures
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Don't retry on non-transient errors
      if (error.message?.includes("deleted") || 
          error.message?.includes("Invalid") ||
          error.statusCode === 403 ||
          error.statusCode === 404) {
        throw error;
      }
      // If it's the last attempt, throw
      if (attempt === maxRetries - 1) {
        throw error;
      }
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms for sync operation`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export async function syncClerkUserToDatabase(userId: string, sessionClaims?: any) {
  const syncStartTime = Date.now();
  // Generate sync ID early so it's available in catch block
  const syncId = `sync_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  let syncDuration = 0;
  
  try {
    console.log(`[${syncId}] Starting sync for user ${userId}`, {
      hasSessionClaims: !!sessionClaims,
      sessionClaimsEmail: sessionClaims?.email,
      timestamp: new Date().toISOString(),
    });
    
    // Check if user is deleted before syncing
    // Wrap in error handling - if database is unavailable, we'll try to continue with Clerk data
    let existingUser;
    try {
      existingUser = await withDatabaseErrorHandling(
        () => storage.getUser(userId),
        'getUserForSync'
      );
      console.log(`[${syncId}] Database query completed`, {
        userExists: !!existingUser,
        isDeleted: existingUser ? isUserDeleted(existingUser) : false,
      });
    } catch (dbError: any) {
      // If it's a connection error, log but continue - we'll try to create user from Clerk data
      if (dbError instanceof ExternalServiceError && dbError.statusCode === 503) {
        console.warn(`[${syncId}] Database unavailable when checking existing user ${userId}, will attempt to create from Clerk data`, {
          error: dbError.message,
          statusCode: dbError.statusCode,
        });
        existingUser = undefined;
      } else {
        // For other database errors (like deleted user check), re-throw
        console.error(`[${syncId}] Database error checking existing user`, {
          error: dbError.message,
          code: dbError.code,
          name: dbError.name,
        });
        throw dbError;
      }
    }
    
    if (existingUser && isUserDeleted(existingUser)) {
      console.warn(`[${syncId}] Attempted sync for deleted user ${userId}`);
      throw new Error("This account has been deleted. Please contact support if you believe this is an error.");
    }
    
    // Get full user details from Clerk with retry logic for transient failures
    let clerkUser;
    try {
      console.log(`[${syncId}] Fetching user from Clerk API`, {
        userId,
        hasSecretKey: !!process.env.CLERK_SECRET_KEY,
      });
      clerkUser = await retryWithBackoff(
        () => clerkClient.users.getUser(userId),
        3, // 3 retries
        1000 // 1 second base delay
      );
      console.log(`[${syncId}] Successfully fetched user from Clerk API`, {
        clerkUserId: clerkUser?.id,
        clerkEmail: clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress,
      });
    } catch (clerkError: any) {
      // Log detailed error for debugging
      console.error(`[${syncId}] Error fetching user from Clerk API (after retries):`, {
        userId,
        error: clerkError.message,
        statusCode: clerkError.statusCode,
        status: clerkError.status,
        stack: clerkError.stack,
        hasSecretKey: !!process.env.CLERK_SECRET_KEY,
        secretKeyPrefix: process.env.CLERK_SECRET_KEY?.substring(0, 10),
        environment: process.env.NODE_ENV,
        retryAttempts: 3,
      });
      
      // If we have an existing user in DB, return it instead of failing
      if (existingUser) {
        console.log(`Clerk API call failed, but user exists in DB. Returning existing user: ${userId}`);
        return existingUser;
      }
      
      // If we have session claims from JWT, try to create a minimal user
      if (sessionClaims && sessionClaims.email) {
        console.log(`Clerk API unavailable, creating minimal user from JWT claims for: ${userId}`);
        try {
          const minimalUser = {
            id: userId,
            email: sessionClaims.email,
            firstName: sessionClaims.firstName || sessionClaims.name?.split(' ')[0] || '',
            lastName: sessionClaims.lastName || sessionClaims.name?.split(' ').slice(1).join(' ') || '',
            profileImageUrl: sessionClaims.imageUrl || null,
          };
          
          // Get current pricing tier with error handling
          let pricingTier = '1.00';
          try {
            const currentTier = await withDatabaseErrorHandling(
              () => storage.getCurrentPricingTier(),
              'getCurrentPricingTierForFallback'
            );
            pricingTier = currentTier?.amount || '1.00';
          } catch (tierError: any) {
            console.warn(`Failed to get pricing tier, using default: ${tierError.message}`);
            // Use default pricing tier if database is unavailable
          }
          
          // Try to create user with retry logic
          const jwtUserData = {
            ...minimalUser,
            pricingTier,
            isApproved: false, // New users must be approved by admin
          };
          
          console.log(`Creating user from JWT claims with isApproved: false`, {
            userId: jwtUserData.id,
            email: jwtUserData.email,
            isApproved: jwtUserData.isApproved,
          });
          
          const jwtUserResult = await retryWithBackoff(
            () => withDatabaseErrorHandling(
              () => storage.upsertUser(jwtUserData),
              'upsertUserFromJWTClaims'
            ),
            2, // 2 retries for database operations
            500 // 500ms base delay
          );
          
          if (jwtUserResult) {
            console.log(`User created from JWT claims successfully`, {
              userId: jwtUserResult.id,
              email: jwtUserResult.email,
              isApproved: jwtUserResult.isApproved,
            });
            
            if (jwtUserResult.isApproved !== false) {
              console.error(`WARNING: User created from JWT with isApproved=${jwtUserResult.isApproved} instead of false!`, {
                userId: jwtUserResult.id,
                email: jwtUserResult.email,
                isApproved: jwtUserResult.isApproved,
              });
            }
            
            // Use the result directly instead of querying again
            return jwtUserResult;
          }
          
          // Fallback: Try to get the created user with retry logic
          const createdUser = await retryWithBackoff(
            () => withDatabaseErrorHandling(
              () => storage.getUser(userId),
              'getUserAfterJWTFallback'
            ),
            2,
            500
          );
          
          if (!createdUser) {
            console.error(`User created but not found after creation for ${userId}. This indicates a database sync issue.`);
            throw new Error("User created but not found. Please try again.");
          }
          
          return createdUser;
        } catch (fallbackError: any) {
          console.error("Error creating user from JWT claims:", {
            userId,
            error: fallbackError.message,
            stack: fallbackError.stack,
            name: fallbackError.name,
            code: fallbackError.code,
          });
          // If it's a connection error, provide a more helpful message
          if (fallbackError instanceof ExternalServiceError && fallbackError.statusCode === 503) {
            throw new Error("Database temporarily unavailable. Please try again in a moment.");
          }
          // Continue to throw original error
          throw fallbackError;
        }
      }
      
      // Re-throw with more context
      throw new Error(`Failed to fetch user from Clerk: ${clerkError.message || 'Unknown error'}`);
    }
    
    // Upsert user in our database with retry logic
    // Store the result to verify it succeeded
    let upsertResult;
    try {
      console.log(`[${syncId}] Upserting user to database`, {
        userId,
        email: clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress,
      });
      upsertResult = await retryWithBackoff(
        async () => {
          const result = await upsertUser(clerkUser);
          if (!result) {
            throw new Error("upsertUser returned undefined - user creation may have failed");
          }
          return result;
        },
        2, // 2 retries for database operations
        500 // 500ms base delay
      );
      console.log(`[${syncId}] Successfully upserted user`, {
        userId: upsertResult.id,
        email: upsertResult.email,
        isApproved: upsertResult.isApproved,
        isAdmin: upsertResult.isAdmin,
      });
    } catch (upsertError: any) {
      const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress || 
                        clerkUser?.emailAddresses?.[0]?.emailAddress || 
                        'unknown';
      console.error(`[${syncId}] Failed to upsert user ${userId}:`, {
        error: upsertError.message,
        stack: upsertError.stack,
        clerkUserId: clerkUser?.id,
        clerkEmail,
        errorCode: upsertError.code,
        errorName: upsertError.name,
        retryAttempts: 2,
      });
      throw new Error(`Failed to create/update user in database: ${upsertError.message}`);
    }
    
    // If upsertUser returned a user directly, use it (more reliable than querying)
    if (upsertResult) {
      const syncDuration = Date.now() - syncStartTime;
      console.log(`[${syncId}] Successfully upserted user ${userId} directly from upsert result`, {
        syncDuration,
        userId: upsertResult.id,
        email: upsertResult.email,
      });
      return upsertResult;
    }
    
    // Fallback: Return the synced user with retry logic
    console.log(`[${syncId}] Upsert result was null, querying database for user`);
    const syncedUser = await retryWithBackoff(
      () => withDatabaseErrorHandling(
        () => storage.getUser(userId),
        'getUserAfterSync'
      ),
      2,
      500
    );
    
    if (!syncedUser) {
      console.error(`[${syncId}] User synced but not found after sync for ${userId}. This indicates a database sync issue.`, {
        userId,
        syncDuration: Date.now() - syncStartTime,
      });
      // Try one more time to get the user
      const retryUser = await withDatabaseErrorHandling(
        () => storage.getUser(userId),
        'getUserAfterSyncRetry'
      );
      if (!retryUser) {
        const syncDuration = Date.now() - syncStartTime;
        console.error(`[${syncId}] User still not found after retry`, {
          userId,
          syncDuration,
        });
        throw new Error("User synced but not found. Please try again.");
      }
      console.log(`[${syncId}] User found on retry`, {
        userId: retryUser.id,
        syncDuration: Date.now() - syncStartTime,
      });
      return retryUser;
    }
    
    const syncDuration = Date.now() - syncStartTime;
    console.log(`[${syncId}] Sync completed successfully`, {
      userId: syncedUser.id,
      email: syncedUser.email,
      syncDuration,
    });
    return syncedUser;
  } catch (error: any) {
    syncDuration = Date.now() - syncStartTime;
    const errorMessage = error?.message || String(error) || "Unknown error";
    const errorName = error?.name || "Error";
    const errorCode = error?.code;
    const errorStack = error?.stack;
    
    console.error(`[${syncId}] Error syncing Clerk user to database:`, {
      userId: userId || "unknown",
      error: errorMessage,
      stack: errorStack,
      name: errorName,
      code: errorCode,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      syncDuration,
      syncId,
    });
    throw error;
  }
}

async function upsertUser(clerkUser: any) {
  // Map Clerk user to our schema format
  const mappedUser = mapClerkUser(clerkUser);
  
  if (!mappedUser.sub || !mappedUser.email) {
    throw new Error("Invalid user data from Clerk");
  }
  
  // Check if user already exists with error handling
  let existingUser;
  try {
    existingUser = await withDatabaseErrorHandling(
      () => storage.getUser(mappedUser.sub),
      'getUserForUpsert'
    );
  } catch (dbError: any) {
    // If it's a connection error, we can't check if user exists
    // But we should still try to upsert - if user exists, it will update; if not, it will create
    if (dbError instanceof ExternalServiceError && dbError.statusCode === 503) {
      console.warn(`Database unavailable when checking existing user for upsert ${mappedUser.sub}, will attempt upsert anyway`);
      existingUser = undefined;
    } else {
      throw dbError;
    }
  }
  
  let result;
  if (existingUser) {
    // For existing users, only update profile information, preserve pricing tier
    // Preserve approval status and admin status
    
    result = await withDatabaseErrorHandling(
      () => storage.upsertUser({
        id: mappedUser.sub,
        email: mappedUser.email,
        firstName: mappedUser.first_name,
        lastName: mappedUser.last_name,
        profileImageUrl: mappedUser.profile_image_url,
        pricingTier: existingUser.pricingTier, // Preserve existing pricing tier (grandfathered)
        isAdmin: existingUser.isAdmin, // Preserve admin status
        isApproved: existingUser.isApproved, // Preserve approval status
        subscriptionStatus: existingUser.subscriptionStatus, // Preserve subscription status
      }),
      'upsertExistingUser'
    );
  } else {
    // For new users, get current pricing tier
    let pricingTier = '1.00';
    try {
      const currentTier = await withDatabaseErrorHandling(
        () => storage.getCurrentPricingTier(),
        'getCurrentPricingTierForNewUser'
      );
      pricingTier = currentTier?.amount || '1.00';
    } catch (tierError: any) {
      console.warn(`Failed to get pricing tier for new user, using default: ${tierError.message}`);
      // Use default pricing tier if database is unavailable
    }

    const newUserData = {
      id: mappedUser.sub,
      email: mappedUser.email,
      firstName: mappedUser.first_name,
      lastName: mappedUser.last_name,
      profileImageUrl: mappedUser.profile_image_url,
      pricingTier,
      isApproved: false, // New users must be approved by admin
    };
    
    console.log(`Creating new user with isApproved: false`, {
      userId: newUserData.id,
      email: newUserData.email,
      isApproved: newUserData.isApproved,
    });

    result = await withDatabaseErrorHandling(
      () => storage.upsertUser(newUserData),
      'upsertNewUser'
    );
    
    // Verify the user was created with isApproved: false
    if (result) {
      console.log(`User created successfully`, {
        userId: result.id,
        email: result.email,
        isApproved: result.isApproved,
        isAdmin: result.isAdmin,
      });
      
      if (result.isApproved !== false) {
        console.error(`WARNING: New user was created with isApproved=${result.isApproved} instead of false!`, {
          userId: result.id,
          email: result.email,
          isApproved: result.isApproved,
        });
      }
    } else {
      console.error(`ERROR: upsertUser returned null/undefined for new user`, {
        userId: newUserData.id,
        email: newUserData.email,
      });
    }
  }
  
  // Return the result from upsertUser
  if (!result) {
    throw new Error("upsertUser returned undefined - user creation/update may have failed");
  }
  
  return result;
}

export async function setupAuth(app: Express) {
  // Clerk middleware automatically handles authentication
  // No manual session management needed - Clerk handles it via cookies/JWT
  
  // Middleware to sync Clerk user with our database on every authenticated request
  // Skip this middleware for the /api/auth/user endpoint to avoid blocking it
  app.use(async (req: any, res, next) => {
    // Skip middleware for /api/auth/user endpoint - let the route handler deal with it
    if (req.path === '/api/auth/user') {
      return next();
    }
    
    // Clerk middleware runs first (via requireAuth/withAuth)
    // After Clerk verifies auth, we sync user to our DB
    if (req.auth?.userId) {
      try {
        const sessionClaims = (req.auth as any)?.sessionClaims;
        await syncClerkUserToDatabase(req.auth.userId, sessionClaims);
      } catch (error: any) {
        console.error("Error syncing Clerk user to database:", error);
        // If it's a deleted user error, block the request
        if (error.message?.includes("deleted")) {
          return res.status(403).json({ 
            message: error.message || "This account has been deleted. Please contact support if you believe this is an error." 
          });
        }
        // For other sync failures, log but don't block - let the route handlers deal with it
        // This prevents empty responses that cause JSON parsing errors
      }
    }
    next();
  });
}

// Middleware to require authentication
// Use this for routes that need authentication
export const isAuthenticated: RequestHandler = requireAuth({
  // This middleware automatically:
  // 1. Verifies the Clerk session/JWT
  // 2. Attaches user data to req.auth
  // 3. Returns 401 if not authenticated
});

// Note: For routes that need optional auth, use clerkMiddleware() directly
// which attaches req.auth without blocking unauthenticated requests

// Admin middleware - checks if user is admin in our database
export const isAdmin: RequestHandler = async (req: any, res, next) => {
  // First ensure user is authenticated
  if (!req.auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.auth.userId;
  let user;
  try {
    user = await withDatabaseErrorHandling(
      () => storage.getUser(userId),
      'getUserForAdminCheck'
    );
  } catch (error: any) {
    // If database is unavailable, deny admin access
    if (error instanceof ExternalServiceError && error.statusCode === 503) {
      return res.status(503).json({ 
        message: "Database temporarily unavailable. Please try again in a moment." 
      });
    }
    // For other errors, deny access
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  next();
};

/**
 * Combined middleware: Admin auth + CSRF validation
 * Use this for state-changing admin operations (POST, PUT, DELETE, PATCH)
 * 
 * Usage:
 * app.post('/api/admin/endpoint', isAuthenticated, ...isAdminWithCsrf, async (req, res) => { ... });
 */
export const isAdminWithCsrf: RequestHandler[] = [isAdmin, validateCsrfToken];

// Helper to get user ID from request
export function getUserId(req: any): string {
  return req.auth?.userId || "";
}

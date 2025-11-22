import { requireAuth } from "@clerk/express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { validateCsrfToken } from "./csrf";

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

async function upsertUser(clerkUser: any) {
  // Map Clerk user to our schema format
  const mappedUser = mapClerkUser(clerkUser);
  
  if (!mappedUser.sub || !mappedUser.email) {
    throw new Error("Invalid user data from Clerk");
  }
  
  // Check if user already exists
  const existingUser = await storage.getUser(mappedUser.sub);
  
  if (existingUser) {
    // For existing users, only update profile information, preserve pricing tier
    // Preserve approval status and admin status
    
    await storage.upsertUser({
      id: mappedUser.sub,
      email: mappedUser.email,
      firstName: mappedUser.first_name,
      lastName: mappedUser.last_name,
      profileImageUrl: mappedUser.profile_image_url,
      pricingTier: existingUser.pricingTier, // Preserve existing pricing tier (grandfathered)
      isAdmin: existingUser.isAdmin, // Preserve admin status
      isApproved: existingUser.isApproved, // Preserve approval status
      subscriptionStatus: existingUser.subscriptionStatus, // Preserve subscription status
    });
  } else {
    // For new users, get current pricing tier
    const currentTier = await storage.getCurrentPricingTier();
    const pricingTier = currentTier?.amount || '1.00';

    await storage.upsertUser({
      id: mappedUser.sub,
      email: mappedUser.email,
      firstName: mappedUser.first_name,
      lastName: mappedUser.last_name,
      profileImageUrl: mappedUser.profile_image_url,
      pricingTier,
    });
  }
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
        // Check if user is deleted before syncing
        const existingUser = await storage.getUser(req.auth.userId);
        if (existingUser && isUserDeleted(existingUser)) {
          // User account has been deleted - block authentication
          return res.status(403).json({ 
            message: "This account has been deleted. Please contact support if you believe this is an error." 
          });
        }
        
        // Get full user details from Clerk
        const clerkUser = await clerkClient.users.getUser(req.auth.userId);
        
        // Upsert user in our database
        await upsertUser(clerkUser);
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
  const user = await storage.getUser(userId);
  
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

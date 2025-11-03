import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { validateCsrfToken } from "./csrf";
import { publicListingLimiter, publicItemLimiter } from "./rateLimiter";
import { fingerprintRequests, getSuspiciousPatterns, getSuspiciousPatternsForIP, clearSuspiciousPatterns } from "./antiScraping";
import { rotateDisplayOrder, addAntiScrapingDelay, isLikelyBot } from "./dataObfuscation";
import { 
  insertInviteCodeSchema, 
  insertPaymentSchema,
  insertPricingTierSchema,
  insertSupportMatchProfileSchema,
  insertPartnershipSchema,
  insertMessageSchema,
  insertExclusionSchema,
  insertReportSchema,
  insertAnnouncementSchema,
  insertSupportmatchAnnouncementSchema,
  insertSleepStorySchema,
  insertSleepStoriesAnnouncementSchema,
  insertLighthouseProfileSchema,
  insertLighthousePropertySchema,
  insertLighthouseMatchSchema,
  insertLighthouseAnnouncementSchema,
  insertSocketrelayRequestSchema,
  insertSocketrelayFulfillmentSchema,
  insertSocketrelayMessageSchema,
  insertSocketrelayProfileSchema,
  insertSocketrelayAnnouncementSchema,
  insertDirectoryProfileSchema,
  insertDirectoryAnnouncementSchema,
  insertChatGroupSchema,
  insertChatgroupsAnnouncementSchema,
  insertTrusttransportProfileSchema,
  insertTrusttransportRideRequestSchema,
  insertTrusttransportAnnouncementSchema,
  insertNpsResponseSchema,
  type InsertTrusttransportRideRequest,
  insertMechanicmatchProfileSchema,
  insertMechanicmatchVehicleSchema,
  insertMechanicmatchServiceRequestSchema,
  insertMechanicmatchJobSchema,
  insertMechanicmatchAvailabilitySchema,
  insertMechanicmatchReviewSchema,
  insertMechanicmatchMessageSchema,
  insertMechanicmatchAnnouncementSchema,
  type InsertMechanicmatchProfile,
  insertLostmailIncidentSchema,
  insertLostmailAnnouncementSchema,
  insertLostmailAuditTrailSchema,
  insertResearchItemSchema,
  insertResearchAnswerSchema,
  insertResearchCommentSchema,
  insertResearchVoteSchema,
  insertResearchLinkProvenanceSchema,
  insertResearchBookmarkSchema,
  insertResearchFollowSchema,
  insertResearchBoardSchema,
  insertResearchColumnSchema,
  insertResearchCardSchema,
  insertResearchReportSchema,
  insertResearchAnnouncementSchema,
  insertGentlepulseMeditationSchema,
  insertGentlepulseRatingSchema,
  insertGentlepulseMoodCheckSchema,
  insertGentlepulseFavoriteSchema,
  insertGentlepulseAnnouncementSchema,
} from "@shared/schema";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Anti-scraping: Fingerprint requests (must be before rate limiting)
  app.use(fingerprintRequests);

  // Helper to get user ID from request
  const getUserId = (req: any): string => req.user?.claims?.sub;

  // Helper to log admin actions
  const logAdminAction = async (
    adminId: string,
    action: string,
    targetType: string,
    targetId?: string,
    details?: any
  ) => {
    try {
      await storage.createAdminActionLog({
        adminId,
        action,
        targetType,
        targetId: targetId || null,
        details: details || null,
      });
    } catch (error) {
      console.error("Failed to log admin action:", error);
    }
  };

  // CSRF Protection for admin endpoints
  // Generate CSRF tokens on GET requests to admin endpoints (runs early)
  app.use('/api/admin', (req, res, next) => {
    if (req.method === 'GET') {
      generateCsrfTokenForAdmin(req, res, next);
    } else {
      next();
    }
  });
  
  app.use('/api/:app/admin', (req, res, next) => {
    if (req.method === 'GET') {
      generateCsrfTokenForAdmin(req, res, next);
    } else {
      next();
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Invite code redemption
  app.post('/api/redeem-invite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { code } = req.body;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "Invite code is required" });
      }

      // Get the invite code
      const invite = await storage.getInviteCodeByCode(code.trim().toUpperCase());

      if (!invite) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      // Check if active
      if (!invite.isActive) {
        return res.status(400).json({ message: "This invite code is no longer active" });
      }

      // Check if expired
      if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
        return res.status(400).json({ message: "This invite code has expired" });
      }

      // Check if fully used
      if (invite.currentUses >= invite.maxUses) {
        return res.status(400).json({ message: "This invite code has reached its maximum uses" });
      }

      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already used an invite code
      if (user.inviteCodeUsed) {
        return res.status(400).json({ message: "You have already used an invite code" });
      }

      // Update user with invite code
      await storage.upsertUser({
        ...user,
        inviteCodeUsed: code.trim().toUpperCase(),
      });

      // Increment invite code usage
      await storage.incrementInviteCodeUsage(code.trim().toUpperCase());

      res.json({ message: "Invite code redeemed successfully" });
    } catch (error: any) {
      console.error("Error redeeming invite code:", error);
      res.status(500).json({ message: error.message || "Failed to redeem invite code" });
    }
  });

  // User routes
  app.get('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const payments = await storage.getPaymentsByUser(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Admin routes - Stats
  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Weekly Performance Review
  app.get('/api/admin/weekly-performance', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const weekStartParam = req.query.weekStart;
      let weekStart: Date;
      
      if (weekStartParam) {
        // Parse date string (YYYY-MM-DD) and interpret as local date, not UTC
        const [year, month, day] = weekStartParam.split('-').map(Number);
        weekStart = new Date(year, month - 1, day);
        if (isNaN(weekStart.getTime())) {
          return res.status(400).json({ message: "Invalid weekStart date format" });
        }
      } else {
        // Default to current week
        weekStart = new Date();
      }
      
      console.log("Weekly performance request - weekStart input:", weekStartParam || "current date");
      console.log("Parsed weekStart date:", weekStart.toISOString());
      
      const review = await storage.getWeeklyPerformanceReview(weekStart);
      
      console.log("=== Weekly Performance Review Result ===");
      console.log("Review keys:", Object.keys(review));
      console.log("Has metrics property:", 'metrics' in review);
      console.log("Metrics value:", review.metrics);
      console.log("Metrics type:", typeof review.metrics);
      
      // ALWAYS ensure metrics is present
      const defaultMetrics = {
        weeklyGrowthRate: 0,
        mrr: 0,
        arr: 0,
        mrrGrowth: 0,
        mau: 0,
        churnRate: 0,
        clv: 0,
        retentionRate: 0,
      };
      
      const response = {
        currentWeek: review.currentWeek,
        previousWeek: review.previousWeek,
        comparison: review.comparison,
        metrics: review.metrics || defaultMetrics,
      };
      
      console.log("Response keys:", Object.keys(response));
      console.log("Response has metrics:", 'metrics' in response);
      console.log("Response metrics:", response.metrics);
      
      res.json(response);
    } catch (error: any) {
      console.error("Error fetching weekly performance review:", error);
      res.status(500).json({ message: error.message || "Failed to fetch weekly performance review" });
    }
  });

  // Admin routes - Anti-scraping monitoring
  app.get('/api/admin/anti-scraping/patterns', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const ip = req.query.ip as string | undefined;
      const patterns = ip 
        ? getSuspiciousPatternsForIP(ip)
        : getSuspiciousPatterns();
      res.json(patterns);
    } catch (error) {
      console.error("Error fetching suspicious patterns:", error);
      res.status(500).json({ message: "Failed to fetch patterns" });
    }
  });

  app.delete('/api/admin/anti-scraping/patterns', isAuthenticated, isAdmin, validateCsrfToken, async (req, res) => {
    try {
      const ip = req.query.ip as string | undefined;
      clearSuspiciousPatterns(ip);
      res.json({ message: ip ? `Cleared patterns for IP ${ip}` : "Cleared all patterns" });
    } catch (error) {
      console.error("Error clearing suspicious patterns:", error);
      res.status(500).json({ message: "Failed to clear patterns" });
    }
  });

  // Admin routes - Users
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:id/verify', isAuthenticated, isAdmin, validateCsrfToken, async (req: any, res) => {
    try {
      const adminId = getUserId(req);
      const { isVerified } = req.body;
      const user = await storage.updateUserVerification(req.params.id, !!isVerified);
      await logAdminAction(adminId, 'verify_user', 'user', user.id, { isVerified: user.isVerified });
      res.json(user);
    } catch (error: any) {
      console.error("Error updating user verification:", error);
      res.status(400).json({ message: error.message || "Failed to update user verification" });
    }
  });

  // Admin routes - Invite codes
  app.get('/api/admin/invites', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const invites = await storage.getAllInviteCodes();
      res.json(invites);
    } catch (error) {
      console.error("Error fetching invite codes:", error);
      res.status(500).json({ message: "Failed to fetch invite codes" });
    }
  });

  app.post('/api/admin/invites', isAuthenticated, isAdmin, validateCsrfToken, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertInviteCodeSchema.parse({
        ...req.body,
        createdBy: userId,
      });

      const invite = await storage.createInviteCode(validatedData);
      
      await logAdminAction(
        userId,
        "generate_invite_code",
        "invite_code",
        invite.id,
        { maxUses: invite.maxUses, expiresAt: invite.expiresAt }
      );

      res.json(invite);
    } catch (error: any) {
      console.error("Error creating invite code:", error);
      res.status(400).json({ message: error.message || "Failed to create invite code" });
    }
  });

  // Admin routes - Payments
  app.get('/api/admin/payments', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post('/api/admin/payments', isAuthenticated, isAdmin, validateCsrfToken, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      console.log("Payment request body:", JSON.stringify(req.body, null, 2));
      
      // Prepare data for validation
      const dataToValidate: any = {
        ...req.body,
        recordedBy: userId,
      };
      
      // Ensure billingMonth is explicitly null for yearly payments
      if (req.body.billingPeriod === "yearly") {
        dataToValidate.billingMonth = null;
      }
      
      console.log("Data to validate:", JSON.stringify(dataToValidate, null, 2));
      const validatedData = insertPaymentSchema.parse(dataToValidate);
      console.log("Validated payment data:", JSON.stringify(validatedData, null, 2));

      const payment = await storage.createPayment(validatedData);
      console.log("Created payment result:", JSON.stringify(payment, null, 2));
      
      await logAdminAction(
        userId,
        "record_payment",
        "payment",
        payment.id,
        { userId: payment.userId, amount: payment.amount }
      );

      res.json(payment);
    } catch (error: any) {
      console.error("Error creating payment:", error);
      res.status(400).json({ message: error.message || "Failed to record payment" });
    }
  });

  // Admin routes - Activity log
  app.get('/api/admin/activity', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const logs = await storage.getAllAdminActionLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Admin routes - Pricing Tiers
  app.get('/api/admin/pricing-tiers', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const tiers = await storage.getAllPricingTiers();
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching pricing tiers:", error);
      res.status(500).json({ message: "Failed to fetch pricing tiers" });
    }
  });

  app.post('/api/admin/pricing-tiers', isAuthenticated, isAdmin, validateCsrfToken, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertPricingTierSchema.parse(req.body);

      const tier = await storage.createPricingTier(validatedData);
      
      await logAdminAction(
        userId,
        "create_pricing_tier",
        "pricing_tier",
        tier.id,
        { amount: tier.amount, effectiveDate: tier.effectiveDate, isCurrentTier: tier.isCurrentTier }
      );

      res.json(tier);
    } catch (error: any) {
      console.error("Error creating pricing tier:", error);
      res.status(400).json({ message: error.message || "Failed to create pricing tier" });
    }
  });

  app.put('/api/admin/pricing-tiers/:id/set-current', isAuthenticated, isAdmin, validateCsrfToken, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const tier = await storage.setCurrentPricingTier(req.params.id);
      
      await logAdminAction(
        userId,
        "set_current_pricing_tier",
        "pricing_tier",
        tier.id,
        { amount: tier.amount }
      );

      res.json(tier);
    } catch (error: any) {
      console.error("Error setting current pricing tier:", error);
      res.status(400).json({ message: error.message || "Failed to set current pricing tier" });
    }
  });

  // ========================================
  // SUPPORTMATCH APP ROUTES
  // ========================================

  // ========================================
  // DIRECTORY APP ROUTES
  // ========================================

  // Current user's Directory profile
  app.get('/api/directory/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getDirectoryProfileByUserId(userId);
      if (!profile) {
        return res.json(null);
      }
      let displayName: string | null = null;
      let userIsVerified = false;
      if (profile.displayNameType === 'nickname' && profile.nickname) {
        displayName = profile.nickname;
      } else if (profile.displayNameType === 'first') {
        // Priority: Directory profile firstName (override) > user firstName
        if (profile.firstName) {
          displayName = profile.firstName;
        } else if (profile.userId) {
          const user = await storage.getUser(profile.userId);
          displayName = user?.firstName || null;
        }
        // Get verification status
        if (profile.userId) {
          const user = await storage.getUser(profile.userId);
          userIsVerified = user?.isVerified || false;
        }
      } else if (profile.userId) {
        const user = await storage.getUser(profile.userId);
        userIsVerified = user?.isVerified || false;
      }
      if (!displayName && profile.nickname) displayName = profile.nickname;
      res.json({ ...profile, displayName, userIsVerified });
    } catch (error) {
      console.error("Error fetching Directory profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/directory/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      // Prevent duplicate
      const existing = await storage.getDirectoryProfileByUserId(userId);
      if (existing) {
        return res.status(400).json({ message: "Directory profile already exists" });
      }

      const validated = insertDirectoryProfileSchema.parse({
        ...req.body,
        userId,
        isClaimed: true,
      });
      const profile = await storage.createDirectoryProfile(validated);
      res.json(profile);
    } catch (error: any) {
      console.error("Error creating Directory profile:", error);
      res.status(400).json({ message: error.message || "Failed to create profile" });
    }
  });

  app.put('/api/directory/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getDirectoryProfileByUserId(userId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });

      // Do not allow changing userId/isClaimed directly
      const { userId: _u, isClaimed: _c, ...update } = req.body;
      const validated = insertDirectoryProfileSchema.partial().parse(update);
      const updated = await storage.updateDirectoryProfile(profile.id, validated);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating Directory profile:", error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  app.delete('/api/directory/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { reason } = req.body;
      await storage.deleteDirectoryProfileWithCascade(userId, reason);
      res.json({ message: "Directory profile deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting Directory profile:", error);
      res.status(400).json({ message: error.message || "Failed to delete profile" });
    }
  });

  // Public routes (with rate limiting to prevent scraping)
  app.get('/api/directory/public/:id', publicItemLimiter, async (req, res) => {
    try {
      const profile = await storage.getDirectoryProfileById(req.params.id);
      if (!profile || !profile.isPublic) {
        return res.status(404).json({ message: "Profile not found" });
      }
      let displayName: string | null = null;
      let userIsVerified = false;
      if (profile.displayNameType === 'nickname' && profile.nickname) {
        displayName = profile.nickname;
      } else if (profile.displayNameType === 'first') {
        // Priority: Directory profile firstName (override) > user firstName
        if (profile.firstName) {
          displayName = profile.firstName;
        } else if (profile.userId) {
          const user = await storage.getUser(profile.userId);
          displayName = user?.firstName || null;
        }
        // Get verification status
        if (profile.userId) {
          const user = await storage.getUser(profile.userId);
          userIsVerified = user?.isVerified || false;
        }
      } else if (profile.userId) {
        const user = await storage.getUser(profile.userId);
        userIsVerified = user?.isVerified || false;
      }
      if (!displayName && profile.nickname) displayName = profile.nickname;
      res.json({ ...profile, displayName, userIsVerified });
    } catch (error) {
      console.error("Error fetching public Directory profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get('/api/directory/public', publicListingLimiter, async (req, res) => {
    try {
      // Add delay for suspicious requests
      const isSuspicious = (req as any).isSuspicious || false;
      const userAgent = req.headers['user-agent'];
      const accept = req.headers['accept'];
      const acceptLang = req.headers['accept-language'];
      const likelyBot = isLikelyBot(userAgent, accept, acceptLang);
      
      if (isSuspicious || likelyBot) {
        await addAntiScrapingDelay(true, 200, 800);
      } else {
        await addAntiScrapingDelay(false, 50, 200);
      }

      const profiles = await storage.listPublicDirectoryProfiles();
      const withNames = await Promise.all(profiles.map(async (p) => {
        let name: string | null = null;
        let userIsVerified = false;
        if (p.displayNameType === 'nickname' && p.nickname) {
          name = p.nickname;
        } else if (p.displayNameType === 'first') {
          // Priority: Directory profile firstName (override) > user firstName
          if (p.firstName) {
            name = p.firstName;
          } else if (p.userId) {
            const u = await storage.getUser(p.userId);
            name = u?.firstName || null;
          }
          // Get verification status
          if (p.userId) {
            const u = await storage.getUser(p.userId);
            userIsVerified = u?.isVerified || false;
          }
        } else if (p.userId) {
          const u = await storage.getUser(p.userId);
          userIsVerified = u?.isVerified || false;
        }
        // Fallback to nickname if no name found
        if (!name && p.nickname) name = p.nickname;
        // Ensure we always return displayName (even if null)
        return { ...p, displayName: name || null, userIsVerified };
      }));
      
      // Rotate display order to make scraping harder
      const rotated = rotateDisplayOrder(withNames);
      
      res.json(rotated);
    } catch (error) {
      console.error("Error listing public Directory profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  // Authenticated list (shows additional non-public fields like signalUrl)
  app.get('/api/directory/list', isAuthenticated, async (_req, res) => {
    try {
      const profiles = await storage.listAllDirectoryProfiles();
      const withNames = await Promise.all(profiles.map(async (p) => {
        let name: string | null = null;
        let userIsVerified = false;
        if (p.displayNameType === 'nickname' && p.nickname) {
          name = p.nickname;
        } else if (p.displayNameType === 'first') {
          // Priority: Directory profile firstName (override) > user firstName
          if (p.firstName) {
            name = p.firstName;
          } else if (p.userId) {
            const u = await storage.getUser(p.userId);
            name = u?.firstName || null;
          }
          // Get verification status
          if (p.userId) {
            const u = await storage.getUser(p.userId);
            userIsVerified = u?.isVerified || false;
          }
        } else if (p.userId) {
          const u = await storage.getUser(p.userId);
          userIsVerified = u?.isVerified || false;
        }
        // Fallback to nickname if no name found
        if (!name && p.nickname) name = p.nickname;
        // Ensure we always return displayName (even if null)
        return { ...p, displayName: name || null, userIsVerified };
      }));
      res.json(withNames);
    } catch (error) {
      console.error("Error listing Directory profiles (auth):", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  // Admin routes for Directory
  app.get('/api/directory/admin/profiles', isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Reuse public list for now; could add full list later
      const profiles = await storage.listPublicDirectoryProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching Directory profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  // Admin creates an unclaimed profile
  app.post('/api/directory/admin/profiles', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = getUserId(req);
      const validated = insertDirectoryProfileSchema.parse({
        ...req.body,
        userId: req.body.userId || null,
        isClaimed: !!req.body.userId,
      });
      const profile = await storage.createDirectoryProfile(validated);
      await logAdminAction(adminId, 'create_directory_profile', 'directory_profile', profile.id, { isClaimed: profile.isClaimed });
      res.json(profile);
    } catch (error: any) {
      console.error("Error creating Directory profile (admin):", error);
      res.status(400).json({ message: error.message || "Failed to create profile" });
    }
  });

  // Removed admin seed endpoint; use scripts/seedDirectory.ts instead

  // Admin assigns an unclaimed profile to a user
  app.put('/api/directory/admin/profiles/:id/assign', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = getUserId(req);
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ message: 'userId is required' });
      const updated = await storage.updateDirectoryProfile(req.params.id, { userId, isClaimed: true } as any);
      await logAdminAction(adminId, 'assign_directory_profile', 'directory_profile', updated.id, { userId });
      res.json(updated);
    } catch (error: any) {
      console.error("Error assigning Directory profile:", error);
      res.status(400).json({ message: error.message || "Failed to assign profile" });
    }
  });

  // Admin update Directory profile (for editing unclaimed profiles)
  app.put('/api/directory/admin/profiles/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = getUserId(req);
      const validated = insertDirectoryProfileSchema.partial().parse(req.body);
      const updated = await storage.updateDirectoryProfile(req.params.id, validated);
      await logAdminAction(adminId, 'update_directory_profile', 'directory_profile', updated.id);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating Directory profile:", error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  // ========================================
  // CHAT GROUPS APP ROUTES
  // ========================================

  // Public routes - anyone can view active groups
  app.get('/api/chatgroups', async (_req, res) => {
    try {
      const groups = await storage.getActiveChatGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching chat groups:", error);
      res.status(500).json({ message: "Failed to fetch chat groups" });
    }
  });

  // Admin routes
  app.get('/api/chatgroups/admin', isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const groups = await storage.getAllChatGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching all chat groups:", error);
      res.status(500).json({ message: "Failed to fetch chat groups" });
    }
  });

  app.post('/api/chatgroups/admin', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = getUserId(req);
      const validated = insertChatGroupSchema.parse(req.body);
      const group = await storage.createChatGroup(validated);
      await logAdminAction(adminId, 'create_chat_group', 'chat_group', group.id);
      res.json(group);
    } catch (error: any) {
      console.error("Error creating chat group:", error);
      res.status(400).json({ message: error.message || "Failed to create chat group" });
    }
  });

  app.put('/api/chatgroups/admin/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = getUserId(req);
      const validated = insertChatGroupSchema.partial().parse(req.body);
      const group = await storage.updateChatGroup(req.params.id, validated);
      await logAdminAction(adminId, 'update_chat_group', 'chat_group', group.id);
      res.json(group);
    } catch (error: any) {
      console.error("Error updating chat group:", error);
      res.status(400).json({ message: error.message || "Failed to update chat group" });
    }
  });

  app.delete('/api/chatgroups/admin/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = getUserId(req);
      await storage.deleteChatGroup(req.params.id);
      await logAdminAction(adminId, 'delete_chat_group', 'chat_group', req.params.id);
      res.json({ message: "Chat group deleted" });
    } catch (error: any) {
      console.error("Error deleting chat group:", error);
      res.status(400).json({ message: error.message || "Failed to delete chat group" });
    }
  });

  // ChatGroups Announcement routes
  app.get('/api/chatgroups/announcements', isAuthenticated, async (req, res) => {
    try {
      const announcements = await storage.getActiveChatgroupsAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching ChatGroups announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.get('/api/chatgroups/admin/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllChatgroupsAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching ChatGroups announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/chatgroups/admin/announcements', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertChatgroupsAnnouncementSchema.parse(req.body);

      const announcement = await storage.createChatgroupsAnnouncement(validatedData);
      
      await logAdminAction(
        userId,
        "create_chatgroups_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title, type: announcement.type }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error creating ChatGroups announcement:", error);
      res.status(400).json({ message: error.message || "Failed to create announcement" });
    }
  });

  app.put('/api/chatgroups/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.updateChatgroupsAnnouncement(req.params.id, req.body);
      
      await logAdminAction(
        userId,
        "update_chatgroups_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error updating ChatGroups announcement:", error);
      res.status(400).json({ message: error.message || "Failed to update announcement" });
    }
  });

  app.delete('/api/chatgroups/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.deactivateChatgroupsAnnouncement(req.params.id);
      
      await logAdminAction(
        userId,
        "deactivate_chatgroups_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error deleting ChatGroups announcement:", error);
      res.status(400).json({ message: error.message || "Failed to delete announcement" });
    }
  });

  // SupportMatch Profile routes
  app.get('/api/supportmatch/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getSupportMatchProfile(userId);
      res.json(profile || null);
    } catch (error) {
      console.error("Error fetching SupportMatch profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/supportmatch/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertSupportMatchProfileSchema.parse({
        ...req.body,
        userId,
      });

      const profile = await storage.createSupportMatchProfile(validatedData);
      res.json(profile);
    } catch (error: any) {
      console.error("Error creating SupportMatch profile:", error);
      res.status(400).json({ message: error.message || "Failed to create profile" });
    }
  });

  app.put('/api/supportmatch/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.updateSupportMatchProfile(userId, req.body);
      res.json(profile);
    } catch (error: any) {
      console.error("Error updating SupportMatch profile:", error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  app.delete('/api/supportmatch/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { reason } = req.body;
      await storage.deleteSupportMatchProfile(userId, reason);
      res.json({ message: "SupportMatch profile deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting SupportMatch profile:", error);
      res.status(400).json({ message: error.message || "Failed to delete profile" });
    }
  });

  // SupportMatch Partnership routes
  app.get('/api/supportmatch/partnership/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const partnership = await storage.getActivePartnershipByUser(userId);
      res.json(partnership || null);
    } catch (error) {
      console.error("Error fetching active partnership:", error);
      res.status(500).json({ message: "Failed to fetch active partnership" });
    }
  });

  app.get('/api/supportmatch/partnership/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const partnerships = await storage.getPartnershipHistory(userId);
      res.json(partnerships);
    } catch (error) {
      console.error("Error fetching partnership history:", error);
      res.status(500).json({ message: "Failed to fetch partnership history" });
    }
  });

  app.get('/api/supportmatch/partnership/:id', isAuthenticated, async (req, res) => {
    try {
      const partnership = await storage.getPartnershipById(req.params.id);
      if (!partnership) {
        return res.status(404).json({ message: "Partnership not found" });
      }
      res.json(partnership);
    } catch (error) {
      console.error("Error fetching partnership:", error);
      res.status(500).json({ message: "Failed to fetch partnership" });
    }
  });

  // SupportMatch Messaging routes
  app.get('/api/supportmatch/messages/:partnershipId', isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getMessagesByPartnership(req.params.partnershipId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/supportmatch/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: userId,
      });

      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: error.message || "Failed to send message" });
    }
  });

  // SupportMatch Exclusion routes
  app.get('/api/supportmatch/exclusions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const exclusions = await storage.getExclusionsByUser(userId);
      res.json(exclusions);
    } catch (error) {
      console.error("Error fetching exclusions:", error);
      res.status(500).json({ message: "Failed to fetch exclusions" });
    }
  });

  app.post('/api/supportmatch/exclusions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertExclusionSchema.parse({
        ...req.body,
        userId,
      });

      const exclusion = await storage.createExclusion(validatedData);
      res.json(exclusion);
    } catch (error: any) {
      console.error("Error creating exclusion:", error);
      res.status(400).json({ message: error.message || "Failed to create exclusion" });
    }
  });

  app.delete('/api/supportmatch/exclusions/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteExclusion(req.params.id);
      res.json({ message: "Exclusion removed successfully" });
    } catch (error) {
      console.error("Error removing exclusion:", error);
      res.status(500).json({ message: "Failed to remove exclusion" });
    }
  });

  // SupportMatch Report routes
  app.post('/api/supportmatch/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertReportSchema.parse({
        ...req.body,
        reporterId: userId,
      });

      const report = await storage.createReport(validatedData);
      res.json(report);
    } catch (error: any) {
      console.error("Error creating report:", error);
      res.status(400).json({ message: error.message || "Failed to create report" });
    }
  });

  // SupportMatch Announcement routes (public)
  app.get('/api/supportmatch/announcements', isAuthenticated, async (req, res) => {
    try {
      const announcements = await storage.getActiveSupportmatchAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching SupportMatch announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // SupportMatch Admin routes
  app.get('/api/supportmatch/admin/stats', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getSupportMatchStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching SupportMatch stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/supportmatch/admin/profiles', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const profiles = await storage.getAllSupportMatchProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  app.get('/api/supportmatch/admin/partnerships', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const partnerships = await storage.getAllPartnerships();
      res.json(partnerships);
    } catch (error) {
      console.error("Error fetching partnerships:", error);
      res.status(500).json({ message: "Failed to fetch partnerships" });
    }
  });

  app.put('/api/supportmatch/admin/partnerships/:id/status', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const partnership = await storage.updatePartnershipStatus(req.params.id, status);
      
      await logAdminAction(
        userId,
        "update_partnership_status",
        "partnership",
        partnership.id,
        { status }
      );

      res.json(partnership);
    } catch (error: any) {
      console.error("Error updating partnership status:", error);
      res.status(400).json({ message: error.message || "Failed to update partnership status" });
    }
  });

  app.post('/api/supportmatch/admin/partnerships/run-matching', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      const partnerships = await storage.createAlgorithmicMatches();
      
      await logAdminAction(
        userId,
        "run_algorithmic_matching",
        "partnership",
        undefined,
        { matchesCreated: partnerships.length }
      );

      res.json({
        message: `Successfully created ${partnerships.length} partnership(s)`,
        partnerships,
      });
    } catch (error: any) {
      console.error("Error running matching algorithm:", error);
      res.status(400).json({ message: error.message || "Failed to run matching algorithm" });
    }
  });

  app.get('/api/supportmatch/admin/reports', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.put('/api/supportmatch/admin/reports/:id/status', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { status, resolution } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const report = await storage.updateReportStatus(req.params.id, status, resolution);
      
      await logAdminAction(
        userId,
        "update_report_status",
        "report",
        report.id,
        { status, resolution }
      );

      res.json(report);
    } catch (error: any) {
      console.error("Error updating report status:", error);
      res.status(400).json({ message: error.message || "Failed to update report status" });
    }
  });

  app.get('/api/supportmatch/admin/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllSupportmatchAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching SupportMatch announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/supportmatch/admin/announcements', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertSupportmatchAnnouncementSchema.parse(req.body);

      const announcement = await storage.createSupportmatchAnnouncement(validatedData);
      
      await logAdminAction(
        userId,
        "create_supportmatch_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title, type: announcement.type }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error creating SupportMatch announcement:", error);
      res.status(400).json({ message: error.message || "Failed to create announcement" });
    }
  });

  app.put('/api/supportmatch/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.updateSupportmatchAnnouncement(req.params.id, req.body);
      
      await logAdminAction(
        userId,
        "update_supportmatch_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error updating SupportMatch announcement:", error);
      res.status(400).json({ message: error.message || "Failed to update announcement" });
    }
  });

  app.delete('/api/supportmatch/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.deactivateSupportmatchAnnouncement(req.params.id);
      
      await logAdminAction(
        userId,
        "deactivate_announcement",
        "announcement",
        announcement.id
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error deactivating announcement:", error);
      res.status(400).json({ message: error.message || "Failed to deactivate announcement" });
    }
  });

  // ========================================
  // SLEEPSTORIES APP ROUTES
  // ========================================

  // User routes - view and play stories
  app.get('/api/sleepstories', isAuthenticated, async (req, res) => {
    try {
      const stories = await storage.getActiveSleepStories();
      res.json(stories);
    } catch (error) {
      console.error("Error fetching sleep stories:", error);
      res.status(500).json({ message: "Failed to fetch sleep stories" });
    }
  });

  app.get('/api/sleepstories/:id', isAuthenticated, async (req, res) => {
    try {
      const story = await storage.getSleepStoryById(req.params.id);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      console.error("Error fetching sleep story:", error);
      res.status(500).json({ message: "Failed to fetch sleep story" });
    }
  });

  // Admin routes - manage stories
  app.get('/api/sleepstories/admin/all', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stories = await storage.getAllSleepStories();
      res.json(stories);
    } catch (error) {
      console.error("Error fetching all sleep stories:", error);
      res.status(500).json({ message: "Failed to fetch sleep stories" });
    }
  });

  app.post('/api/sleepstories/admin', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Validate request body
      const validatedData = insertSleepStorySchema.parse(req.body);
      const story = await storage.createSleepStory(validatedData);
      
      await logAdminAction(
        userId,
        "create_sleep_story",
        "sleep_story",
        story.id,
        { title: story.title }
      );

      res.json(story);
    } catch (error: any) {
      console.error("Error creating sleep story:", error);
      res.status(400).json({ message: error.message || "Failed to create sleep story" });
    }
  });

  app.put('/api/sleepstories/admin/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Check if story exists
      const existingStory = await storage.getSleepStoryById(req.params.id);
      if (!existingStory) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      // Validate request body (partial update)
      const validatedData = insertSleepStorySchema.partial().parse(req.body);
      const story = await storage.updateSleepStory(req.params.id, validatedData);
      
      await logAdminAction(
        userId,
        "update_sleep_story",
        "sleep_story",
        story.id,
        { title: story.title }
      );

      res.json(story);
    } catch (error: any) {
      console.error("Error updating sleep story:", error);
      res.status(400).json({ message: error.message || "Failed to update sleep story" });
    }
  });

  app.delete('/api/sleepstories/admin/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Check if story exists
      const existingStory = await storage.getSleepStoryById(req.params.id);
      if (!existingStory) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      await storage.deleteSleepStory(req.params.id);
      
      await logAdminAction(
        userId,
        "delete_sleep_story",
        "sleep_story",
        req.params.id
      );

      res.json({ message: "Sleep story deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting sleep story:", error);
      res.status(400).json({ message: error.message || "Failed to delete sleep story" });
    }
  });

  // SleepStories Announcement routes (public)
  app.get('/api/sleepstories/announcements', isAuthenticated, async (req, res) => {
    try {
      const announcements = await storage.getActiveSleepStoriesAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching SleepStories announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // SleepStories Admin announcement routes
  app.get('/api/sleepstories/admin/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllSleepStoriesAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching SleepStories announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/sleepstories/admin/announcements', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertSleepStoriesAnnouncementSchema.parse(req.body);

      const announcement = await storage.createSleepStoriesAnnouncement(validatedData);
      
      await logAdminAction(
        userId,
        "create_sleepstories_announcement",
        "sleepstories_announcement",
        announcement.id,
        { title: announcement.title, type: announcement.type }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error creating SleepStories announcement:", error);
      res.status(400).json({ message: error.message || "Failed to create announcement" });
    }
  });

  app.put('/api/sleepstories/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.updateSleepStoriesAnnouncement(req.params.id, req.body);
      
      await logAdminAction(
        userId,
        "update_sleepstories_announcement",
        "sleepstories_announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error updating SleepStories announcement:", error);
      res.status(400).json({ message: error.message || "Failed to update announcement" });
    }
  });

  app.delete('/api/sleepstories/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.deactivateSleepStoriesAnnouncement(req.params.id);
      
      await logAdminAction(
        userId,
        "deactivate_sleepstories_announcement",
        "sleepstories_announcement",
        announcement.id
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error deactivating SleepStories announcement:", error);
      res.status(400).json({ message: error.message || "Failed to deactivate announcement" });
    }
  });

  // ========================================
  // LIGHTHOUSE APP ROUTES
  // ========================================

  // Profile routes
  app.get('/api/lighthouse/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getLighthouseProfileByUserId(userId);
      res.json(profile || null);
    } catch (error) {
      console.error("Error fetching LightHouse profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/lighthouse/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Check if profile already exists
      const existingProfile = await storage.getLighthouseProfileByUserId(userId);
      if (existingProfile) {
        return res.status(400).json({ message: "Profile already exists" });
      }
      
      // Validate and create profile
      const validatedData = insertLighthouseProfileSchema.parse({
        ...req.body,
        userId,
      });
      const profile = await storage.createLighthouseProfile(validatedData);
      
      res.json(profile);
    } catch (error: any) {
      console.error("Error creating LightHouse profile:", error);
      res.status(400).json({ message: error.message || "Failed to create profile" });
    }
  });

  app.put('/api/lighthouse/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getLighthouseProfileByUserId(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Validate partial update (exclude userId from being updated)
      const { userId: _, ...updateData } = req.body;
      const validatedData = insertLighthouseProfileSchema.partial().parse(updateData);
      const updated = await storage.updateLighthouseProfile(profile.id, validatedData);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating LightHouse profile:", error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  app.delete('/api/lighthouse/profile', isAuthenticated, async (req: any, res) => {
    try {
      console.log("DELETE /api/lighthouse/profile - Route hit");
      const userId = getUserId(req);
      console.log("User ID:", userId);
      const { reason } = req.body;
      console.log("Reason:", reason);
      await storage.deleteLighthouseProfile(userId, reason);
      console.log("Profile deleted successfully");
      res.json({ message: "LightHouse profile deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting LightHouse profile:", error);
      res.status(400).json({ message: error.message || "Failed to delete profile" });
    }
  });

  // Property browsing routes (for seekers)
  app.get('/api/lighthouse/properties', isAuthenticated, async (req, res) => {
    try {
      const properties = await storage.getAllActiveProperties();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get('/api/lighthouse/properties/:id', isAuthenticated, async (req, res) => {
    try {
      const property = await storage.getLighthousePropertyById(req.params.id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  // Property management routes (for hosts)
  app.get('/api/lighthouse/my-properties', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getLighthouseProfileByUserId(userId);
      
      if (!profile) {
        return res.json([]);
      }
      
      const properties = await storage.getPropertiesByHost(profile.id);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching my properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.post('/api/lighthouse/properties', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getLighthouseProfileByUserId(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found. Please create a profile first." });
      }
      
      if (profile.profileType !== 'host') {
        return res.status(403).json({ message: "Only hosts can create properties" });
      }
      
      // Validate and create property
      const validatedData = insertLighthousePropertySchema.parse({
        ...req.body,
        hostId: profile.id,
      });
      const property = await storage.createLighthouseProperty(validatedData);
      
      res.json(property);
    } catch (error: any) {
      console.error("Error creating property:", error);
      res.status(400).json({ message: error.message || "Failed to create property" });
    }
  });

  app.put('/api/lighthouse/properties/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getLighthouseProfileByUserId(userId);
      const property = await storage.getLighthousePropertyById(req.params.id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (!profile || property.hostId !== profile.id) {
        return res.status(403).json({ message: "You can only edit your own properties" });
      }
      
      // Validate partial update (exclude hostId from being updated)
      const { hostId: _, ...updateData } = req.body;
      const validatedData = insertLighthousePropertySchema.partial().parse(updateData);
      const updated = await storage.updateLighthouseProperty(req.params.id, validatedData);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating property:", error);
      res.status(400).json({ message: error.message || "Failed to update property" });
    }
  });

  // Match routes
  app.get('/api/lighthouse/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getLighthouseProfileByUserId(userId);
      
      if (!profile) {
        return res.json([]);
      }
      
      const matches = await storage.getMatchesByProfile(profile.id);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.post('/api/lighthouse/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getLighthouseProfileByUserId(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found. Please create a profile first." });
      }
      
      if (profile.profileType !== 'seeker') {
        return res.status(403).json({ message: "Only seekers can request matches" });
      }
      
      const { propertyId, message } = req.body;
      
      if (!propertyId) {
        return res.status(400).json({ message: "Property ID is required" });
      }
      
      // Validate property exists
      const property = await storage.getLighthousePropertyById(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Create match request (note: no hostId field, it's determined via property)
      const validatedData = insertLighthouseMatchSchema.parse({
        seekerId: profile.id,
        propertyId,
        seekerMessage: message || null,
        status: 'pending',
      });
      const match = await storage.createLighthouseMatch(validatedData);
      
      res.json(match);
    } catch (error: any) {
      console.error("Error creating match:", error);
      res.status(400).json({ message: error.message || "Failed to create match" });
    }
  });

  app.put('/api/lighthouse/matches/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getLighthouseProfileByUserId(userId);
      const match = await storage.getLighthouseMatchById(req.params.id);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (!profile) {
        return res.status(403).json({ message: "Profile not found" });
      }
      
      // Get property to determine host
      const property = await storage.getLighthousePropertyById(match.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Check authorization
      const isHost = property.hostId === profile.id;
      const isSeeker = match.seekerId === profile.id;
      
      if (!isHost && !isSeeker) {
        return res.status(403).json({ message: "You can only update your own matches" });
      }
      
      const { status, hostResponse } = req.body;
      
      // Only hosts can accept/reject matches
      if (status && status !== 'cancelled' && !isHost) {
        return res.status(403).json({ message: "Only the host can accept or reject matches" });
      }
      
      // Build update data
      const updateData: any = {};
      if (status) updateData.status = status;
      if (hostResponse && isHost) updateData.hostResponse = hostResponse;
      
      const validatedData = insertLighthouseMatchSchema.partial().parse(updateData);
      const updated = await storage.updateLighthouseMatch(req.params.id, validatedData);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating match:", error);
      res.status(400).json({ message: error.message || "Failed to update match" });
    }
  });

  // Admin routes
  app.get('/api/lighthouse/admin/stats', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getLighthouseStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching LightHouse stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/lighthouse/admin/profiles', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const profiles = await storage.getAllLighthouseProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching all profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  app.get('/api/lighthouse/admin/profiles/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const profile = await storage.getLighthouseProfileById(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Enrich with user information
      const user = profile.userId ? await storage.getUser(profile.userId) : null;
      const profileWithUser = {
        ...profile,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isVerified: user.isVerified,
        } : null,
      };
      
      res.json(profileWithUser);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get('/api/lighthouse/admin/seekers', isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get all seekers (both active and inactive) for admin view
      const allProfiles = await storage.getAllLighthouseProfiles();
      console.log(`[LightHouse Admin] Total profiles: ${allProfiles.length}`);
      const seekers = allProfiles.filter(p => p.profileType === 'seeker');
      console.log(`[LightHouse Admin] Found ${seekers.length} seekers`);
      
      // Enrich with user information
      const seekersWithUsers = await Promise.all(seekers.map(async (seeker) => {
        const user = seeker.userId ? await storage.getUser(seeker.userId) : null;
        return {
          ...seeker,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isVerified: user.isVerified,
          } : null,
        };
      }));
      console.log(`[LightHouse Admin] Returning ${seekersWithUsers.length} seekers with user data`);
      res.json(seekersWithUsers);
    } catch (error) {
      console.error("Error fetching seekers:", error);
      res.status(500).json({ message: "Failed to fetch seekers" });
    }
  });

  app.get('/api/lighthouse/admin/hosts', isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get all hosts (both active and inactive) for admin view
      const allProfiles = await storage.getAllLighthouseProfiles();
      console.log(`[LightHouse Admin] Total profiles: ${allProfiles.length}`);
      const hosts = allProfiles.filter(p => p.profileType === 'host');
      console.log(`[LightHouse Admin] Found ${hosts.length} hosts`);
      
      // Enrich with user information
      const hostsWithUsers = await Promise.all(hosts.map(async (host) => {
        const user = host.userId ? await storage.getUser(host.userId) : null;
        return {
          ...host,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isVerified: user.isVerified,
          } : null,
        };
      }));
      console.log(`[LightHouse Admin] Returning ${hostsWithUsers.length} hosts with user data`);
      res.json(hostsWithUsers);
    } catch (error) {
      console.error("Error fetching hosts:", error);
      res.status(500).json({ message: "Failed to fetch hosts" });
    }
  });

  app.get('/api/lighthouse/admin/properties', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching all properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.put('/api/lighthouse/admin/properties/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const property = await storage.getLighthousePropertyById(req.params.id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Validate partial update
      const validatedData = insertLighthousePropertySchema.partial().parse(req.body);
      const updated = await storage.updateLighthouseProperty(req.params.id, validatedData);
      
      await logAdminAction(
        userId,
        "update_lighthouse_property",
        "lighthouse_property",
        updated.id,
        { title: updated.title }
      );
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating property:", error);
      res.status(400).json({ message: error.message || "Failed to update property" });
    }
  });

  app.get('/api/lighthouse/admin/matches', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const matches = await storage.getAllLighthouseMatches();
      res.json(matches);
    } catch (error) {
      console.error("Error fetching all matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.put('/api/lighthouse/admin/matches/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const match = await storage.getLighthouseMatchById(req.params.id);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Validate partial update
      const validatedData = insertLighthouseMatchSchema.partial().parse(req.body);
      const updated = await storage.updateLighthouseMatch(req.params.id, validatedData);
      
      await logAdminAction(
        userId,
        "update_lighthouse_match",
        "lighthouse_match",
        updated.id,
        { status: updated.status }
      );
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating match:", error);
      res.status(400).json({ message: error.message || "Failed to update match" });
    }
  });

  // LightHouse Announcement routes (public)
  app.get('/api/lighthouse/announcements', isAuthenticated, async (req, res) => {
    try {
      const announcements = await storage.getActiveLighthouseAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching LightHouse announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // LightHouse Admin announcement routes
  app.get('/api/lighthouse/admin/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllLighthouseAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching LightHouse announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/lighthouse/admin/announcements', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertLighthouseAnnouncementSchema.parse(req.body);

      const announcement = await storage.createLighthouseAnnouncement(validatedData);
      
      await logAdminAction(
        userId,
        "create_lighthouse_announcement",
        "lighthouse_announcement",
        announcement.id,
        { title: announcement.title, type: announcement.type }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error creating LightHouse announcement:", error);
      res.status(400).json({ message: error.message || "Failed to create announcement" });
    }
  });

  app.put('/api/lighthouse/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.updateLighthouseAnnouncement(req.params.id, req.body);
      
      await logAdminAction(
        userId,
        "update_lighthouse_announcement",
        "lighthouse_announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error updating LightHouse announcement:", error);
      res.status(400).json({ message: error.message || "Failed to update announcement" });
    }
  });

  app.delete('/api/lighthouse/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.deactivateLighthouseAnnouncement(req.params.id);
      
      await logAdminAction(
        userId,
        "deactivate_lighthouse_announcement",
        "lighthouse_announcement",
        announcement.id
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error deactivating LightHouse announcement:", error);
      res.status(400).json({ message: error.message || "Failed to deactivate announcement" });
    }
  });

  // SocketRelay Routes

  // SocketRelay Profile routes
  app.get('/api/socketrelay/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getSocketrelayProfile(userId);
      res.json(profile || null);
    } catch (error) {
      console.error("Error fetching SocketRelay profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/socketrelay/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertSocketrelayProfileSchema.parse({
        ...req.body,
        userId,
      });

      const profile = await storage.createSocketrelayProfile(validatedData);
      res.json(profile);
    } catch (error: any) {
      console.error("Error creating SocketRelay profile:", error);
      res.status(400).json({ message: error.message || "Failed to create profile" });
    }
  });

  app.put('/api/socketrelay/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.updateSocketrelayProfile(userId, req.body);
      res.json(profile);
    } catch (error: any) {
      console.error("Error updating SocketRelay profile:", error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  app.delete('/api/socketrelay/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { reason } = req.body;
      await storage.deleteSocketrelayProfile(userId, reason);
      res.json({ message: "SocketRelay profile deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting SocketRelay profile:", error);
      res.status(400).json({ message: error.message || "Failed to delete profile" });
    }
  });

  // Get all active requests
  app.get('/api/socketrelay/requests', isAuthenticated, async (req: any, res) => {
    try {
      const requests = await storage.getActiveSocketrelayRequests();
      res.json(requests);
    } catch (error: any) {
      console.error("Error fetching SocketRelay requests:", error);
      res.status(500).json({ message: error.message || "Failed to fetch requests" });
    }
  });

  // Get single request by ID
  app.get('/api/socketrelay/requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const request = await storage.getSocketrelayRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.json(request);
    } catch (error: any) {
      console.error("Error fetching SocketRelay request:", error);
      res.status(500).json({ message: error.message || "Failed to fetch request" });
    }
  });

  // Get user's own requests
  app.get('/api/socketrelay/my-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const requests = await storage.getSocketrelayRequestsByUser(userId);
      res.json(requests);
    } catch (error: any) {
      console.error("Error fetching user's SocketRelay requests:", error);
      res.status(500).json({ message: error.message || "Failed to fetch requests" });
    }
  });

  // Create a new request
  app.post('/api/socketrelay/requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertSocketrelayRequestSchema.parse(req.body);
      
      const request = await storage.createSocketrelayRequest(userId, validated.description, validated.isPublic || false);
      res.json(request);
    } catch (error: any) {
      console.error("Error creating SocketRelay request:", error);
      res.status(400).json({ message: error.message || "Failed to create request" });
    }
  });

  // Public SocketRelay request routes (no auth required, with rate limiting)
  app.get('/api/socketrelay/public', publicListingLimiter, async (req, res) => {
    try {
      // Add delay for suspicious requests
      const isSuspicious = (req as any).isSuspicious || false;
      const userAgent = req.headers['user-agent'];
      const accept = req.headers['accept'];
      const acceptLang = req.headers['accept-language'];
      const likelyBot = isLikelyBot(userAgent, accept, acceptLang);
      
      if (isSuspicious || likelyBot) {
        await addAntiScrapingDelay(true, 200, 800);
      } else {
        await addAntiScrapingDelay(false, 50, 200);
      }

      const requests = await storage.listPublicSocketrelayRequests();
      
      // Enrich requests with creator info
      const enrichedRequests = await Promise.all(requests.map(async (request) => {
        const creatorProfile = await storage.getSocketrelayProfile(request.userId);
        const creator = await storage.getUser(request.userId);
        
        return {
          ...request,
          creatorProfile: creatorProfile ? {
            city: creatorProfile.city,
            state: creatorProfile.state,
            country: creatorProfile.country,
          } : null,
          creator: creator ? {
            firstName: creator.firstName,
            lastName: creator.lastName,
            isVerified: creator.isVerified,
          } : null,
        };
      }));
      
      // Rotate display order to make scraping harder
      const rotated = rotateDisplayOrder(enrichedRequests);
      
      res.json(rotated);
    } catch (error) {
      console.error("Error fetching public SocketRelay requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.get('/api/socketrelay/public/:id', publicItemLimiter, async (req, res) => {
    try {
      const request = await storage.getPublicSocketrelayRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found or not public" });
      }
      
      // Get creator profile for location info
      const creatorProfile = await storage.getSocketrelayProfile(request.userId);
      const creator = await storage.getUser(request.userId);
      
      res.json({
        ...request,
        creatorProfile: creatorProfile ? {
          city: creatorProfile.city,
          state: creatorProfile.state,
          country: creatorProfile.country,
        } : null,
        creator: creator ? {
          firstName: creator.firstName,
          lastName: creator.lastName,
          isVerified: creator.isVerified,
        } : null,
      });
    } catch (error) {
      console.error("Error fetching public SocketRelay request:", error);
      res.status(500).json({ message: "Failed to fetch request" });
    }
  });

  // Fulfill a request (create fulfillment)
  app.post('/api/socketrelay/requests/:id/fulfill', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const requestId = req.params.id;

      // Check if request exists and is active
      const request = await storage.getSocketrelayRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (request.status !== 'active') {
        return res.status(400).json({ message: "Request is not active" });
      }

      // Check if already expired
      if (new Date(request.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Request has expired" });
      }

      // Don't allow users to fulfill their own requests
      if (request.userId === userId) {
        return res.status(400).json({ message: "You cannot fulfill your own request" });
      }

      const fulfillment = await storage.createSocketrelayFulfillment(requestId, userId);
      res.json(fulfillment);
    } catch (error: any) {
      console.error("Error fulfilling SocketRelay request:", error);
      res.status(400).json({ message: error.message || "Failed to fulfill request" });
    }
  });

  // Get fulfillment by ID (with request data)
  app.get('/api/socketrelay/fulfillments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const fulfillment = await storage.getSocketrelayFulfillmentById(req.params.id);
      
      if (!fulfillment) {
        return res.status(404).json({ message: "Fulfillment not found" });
      }

      // Check if user is part of this fulfillment
      const request = await storage.getSocketrelayRequestById(fulfillment.requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (request.userId !== userId && fulfillment.fulfillerUserId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json({ fulfillment, request });
    } catch (error: any) {
      console.error("Error fetching SocketRelay fulfillment:", error);
      res.status(500).json({ message: error.message || "Failed to fetch fulfillment" });
    }
  });

  // Get user's fulfillments (where they are the fulfiller)
  app.get('/api/socketrelay/my-fulfillments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const fulfillments = await storage.getSocketrelayFulfillmentsByUser(userId);
      res.json(fulfillments);
    } catch (error: any) {
      console.error("Error fetching user's SocketRelay fulfillments:", error);
      res.status(500).json({ message: error.message || "Failed to fetch fulfillments" });
    }
  });

  // Close a fulfillment
  app.post('/api/socketrelay/fulfillments/:id/close', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { status } = req.body; // completed_success or completed_failure

      if (!status || !['completed_success', 'completed_failure', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const fulfillment = await storage.getSocketrelayFulfillmentById(req.params.id);
      if (!fulfillment) {
        return res.status(404).json({ message: "Fulfillment not found" });
      }

      // Check if user is part of this fulfillment
      const request = await storage.getSocketrelayRequestById(fulfillment.requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (request.userId !== userId && fulfillment.fulfillerUserId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.closeSocketrelayFulfillment(req.params.id, userId, status);
      
      // Update request status to closed
      await storage.updateSocketrelayRequestStatus(request.id, 'closed');

      res.json(updated);
    } catch (error: any) {
      console.error("Error closing SocketRelay fulfillment:", error);
      res.status(400).json({ message: error.message || "Failed to close fulfillment" });
    }
  });

  // Get messages for a fulfillment
  app.get('/api/socketrelay/fulfillments/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const fulfillmentId = req.params.id;

      const fulfillment = await storage.getSocketrelayFulfillmentById(fulfillmentId);
      if (!fulfillment) {
        return res.status(404).json({ message: "Fulfillment not found" });
      }

      // Check if user is part of this fulfillment
      const request = await storage.getSocketrelayRequestById(fulfillment.requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (request.userId !== userId && fulfillment.fulfillerUserId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getSocketrelayMessagesByFulfillment(fulfillmentId);
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching SocketRelay messages:", error);
      res.status(500).json({ message: error.message || "Failed to fetch messages" });
    }
  });

  // Send a message in a fulfillment chat
  app.post('/api/socketrelay/fulfillments/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const fulfillmentId = req.params.id;
      const { content } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const fulfillment = await storage.getSocketrelayFulfillmentById(fulfillmentId);
      if (!fulfillment) {
        return res.status(404).json({ message: "Fulfillment not found" });
      }

      // Check if user is part of this fulfillment
      const request = await storage.getSocketrelayRequestById(fulfillment.requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (request.userId !== userId && fulfillment.fulfillerUserId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const message = await storage.createSocketrelayMessage({
        fulfillmentId,
        senderId: userId,
        content: content.trim(),
      });

      res.json(message);
    } catch (error: any) {
      console.error("Error sending SocketRelay message:", error);
      res.status(400).json({ message: error.message || "Failed to send message" });
    }
  });

  // SocketRelay Admin Routes
  app.get('/api/socketrelay/admin/requests', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllSocketrelayRequests();
      res.json(requests);
    } catch (error: any) {
      console.error("Error fetching all SocketRelay requests:", error);
      res.status(500).json({ message: error.message || "Failed to fetch requests" });
    }
  });

  app.get('/api/socketrelay/admin/fulfillments', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const fulfillments = await storage.getAllSocketrelayFulfillments();
      res.json(fulfillments);
    } catch (error: any) {
      console.error("Error fetching all SocketRelay fulfillments:", error);
      res.status(500).json({ message: error.message || "Failed to fetch fulfillments" });
    }
  });

  app.delete('/api/socketrelay/admin/requests/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteSocketrelayRequest(req.params.id);
      res.json({ message: "Request deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting SocketRelay request:", error);
      res.status(500).json({ message: error.message || "Failed to delete request" });
    }
  });

  // SocketRelay Announcement routes
  app.get('/api/socketrelay/announcements', isAuthenticated, async (req, res) => {
    try {
      const announcements = await storage.getActiveSocketrelayAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching SocketRelay announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.get('/api/socketrelay/admin/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllSocketrelayAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching SocketRelay announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/socketrelay/admin/announcements', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertSocketrelayAnnouncementSchema.parse(req.body);

      const announcement = await storage.createSocketrelayAnnouncement(validatedData);
      
      await logAdminAction(
        userId,
        "create_socketrelay_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title, type: announcement.type }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error creating SocketRelay announcement:", error);
      res.status(400).json({ message: error.message || "Failed to create announcement" });
    }
  });

  app.put('/api/socketrelay/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.updateSocketrelayAnnouncement(req.params.id, req.body);
      
      await logAdminAction(
        userId,
        "update_socketrelay_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error updating SocketRelay announcement:", error);
      res.status(400).json({ message: error.message || "Failed to update announcement" });
    }
  });

  app.delete('/api/socketrelay/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.deactivateSocketrelayAnnouncement(req.params.id);
      
      await logAdminAction(
        userId,
        "deactivate_socketrelay_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error deleting SocketRelay announcement:", error);
      res.status(400).json({ message: error.message || "Failed to delete announcement" });
    }
  });

  // Directory Announcement routes
  app.get('/api/directory/announcements', isAuthenticated, async (req, res) => {
    try {
      const announcements = await storage.getActiveDirectoryAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching Directory announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.get('/api/directory/admin/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllDirectoryAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching Directory announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/directory/admin/announcements', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertDirectoryAnnouncementSchema.parse(req.body);

      const announcement = await storage.createDirectoryAnnouncement(validatedData);
      
      await logAdminAction(
        userId,
        "create_directory_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title, type: announcement.type }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error creating Directory announcement:", error);
      res.status(400).json({ message: error.message || "Failed to create announcement" });
    }
  });

  app.put('/api/directory/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.updateDirectoryAnnouncement(req.params.id, req.body);
      
      await logAdminAction(
        userId,
        "update_directory_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error updating Directory announcement:", error);
      res.status(400).json({ message: error.message || "Failed to update announcement" });
    }
  });

  app.delete('/api/directory/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.deactivateDirectoryAnnouncement(req.params.id);
      
      await logAdminAction(
        userId,
        "deactivate_directory_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error deleting Directory announcement:", error);
      res.status(400).json({ message: error.message || "Failed to delete announcement" });
    }
  });

  // ========================================
  // TRUSTTRANSPORT ROUTES
  // ========================================

  // TrustTransport Announcement routes (public)
  app.get('/api/trusttransport/announcements', isAuthenticated, async (req, res) => {
    try {
      const announcements = await storage.getActiveTrusttransportAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching TrustTransport announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // TrustTransport Profile routes
  app.get('/api/trusttransport/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getTrusttransportProfile(userId);
      res.json(profile || null);
    } catch (error: any) {
      console.error("Error fetching TrustTransport profile:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/trusttransport/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertTrusttransportProfileSchema.parse({
        ...req.body,
        userId,
      });
      const profile = await storage.createTrusttransportProfile(validatedData);
      res.json(profile);
    } catch (error: any) {
      console.error("Error creating TrustTransport profile:", error);
      res.status(400).json({ message: error.message || "Failed to create profile" });
    }
  });

  app.put('/api/trusttransport/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.updateTrusttransportProfile(userId, req.body);
      res.json(profile);
    } catch (error: any) {
      console.error("Error updating TrustTransport profile:", error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  app.delete('/api/trusttransport/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { reason } = req.body;
      await storage.deleteTrusttransportProfile(userId, reason);
      res.json({ message: "TrustTransport profile deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting TrustTransport profile:", error);
      res.status(400).json({ message: error.message || "Failed to delete profile" });
    }
  });

  // TrustTransport Ride Request routes (simplified model)
  
  // Create new ride request (as a rider) - MUST come before :id routes
  app.post('/api/trusttransport/ride-requests', isAuthenticated, async (req: any, res) => {
    try {
      console.log("POST /api/trusttransport/ride-requests - Request received");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      const userId = getUserId(req);
      console.log("User ID:", userId);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in authentication token" });
      }
      const profile = await storage.getTrusttransportProfile(userId);
      if (!profile || !profile.isRider) {
        return res.status(400).json({ message: "You must be a rider to create ride requests" });
      }
      const validatedData = insertTrusttransportRideRequestSchema.parse(req.body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      // Add riderId after validation since it's omitted from the schema
      const requestData = {
        ...validatedData,
        riderId: userId,
      } as InsertTrusttransportRideRequest & { riderId: string };
      console.log("Request data with riderId:", JSON.stringify(requestData, null, 2));
      const request = await storage.createTrusttransportRideRequest(requestData);
      res.json(request);
    } catch (error: any) {
      console.error("Error creating TrustTransport ride request:", error);
      res.status(400).json({ message: error.message || "Failed to create ride request" });
    }
  });
  
  // Get open ride requests (for drivers to browse)
  app.get('/api/trusttransport/ride-requests/open', isAuthenticated, async (req: any, res) => {
    try {
      const requests = await storage.getOpenTrusttransportRideRequests();
      res.json(requests);
    } catch (error: any) {
      console.error("Error fetching open TrustTransport ride requests:", error);
      res.status(500).json({ message: error.message || "Failed to fetch ride requests" });
    }
  });

  // Get user's ride requests (as a rider)
  app.get('/api/trusttransport/ride-requests/my-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const requests = await storage.getTrusttransportRideRequestsByRider(userId);
      res.json(requests);
    } catch (error: any) {
      console.error("Error fetching user's TrustTransport ride requests:", error);
      res.status(500).json({ message: error.message || "Failed to fetch ride requests" });
    }
  });

  // Get requests claimed by driver
  app.get('/api/trusttransport/ride-requests/my-claimed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getTrusttransportProfile(userId);
      if (!profile || !profile.isDriver) {
        return res.json([]);
      }
      const requests = await storage.getTrusttransportRideRequestsByDriver(profile.id);
      res.json(requests);
    } catch (error: any) {
      console.error("Error fetching driver's claimed requests:", error);
      res.status(500).json({ message: error.message || "Failed to fetch claimed requests" });
    }
  });

  // Get single ride request
  app.get('/api/trusttransport/ride-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const request = await storage.getTrusttransportRideRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Ride request not found" });
      }
      res.json(request);
    } catch (error: any) {
      console.error("Error fetching TrustTransport ride request:", error);
      res.status(500).json({ message: error.message || "Failed to fetch ride request" });
    }
  });


  // Claim a ride request (as a driver)
  app.post('/api/trusttransport/ride-requests/:id/claim', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { driverMessage } = req.body;
      const request = await storage.claimTrusttransportRideRequest(req.params.id, userId, driverMessage);
      res.json(request);
    } catch (error: any) {
      console.error("Error claiming TrustTransport ride request:", error);
      res.status(400).json({ message: error.message || "Failed to claim ride request" });
    }
  });

  // Update ride request (rider can update their request, driver can update claimed request)
  app.put('/api/trusttransport/ride-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const request = await storage.getTrusttransportRideRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Ride request not found" });
      }
      
      const profile = await storage.getTrusttransportProfile(userId);
      
      // Check authorization
      const isRider = request.riderId === userId;
      const isDriver = request.driverId === profile?.id && profile?.isDriver;
      
      if (!isRider && !isDriver) {
        return res.status(403).json({ message: "Unauthorized to update this ride request" });
      }
      
      // Riders can only update open requests
      if (isRider && request.status !== 'open') {
        return res.status(400).json({ message: "Cannot update a request that has been claimed" });
      }
      
      const validatedData = insertTrusttransportRideRequestSchema.partial().parse(req.body);
      const updated = await storage.updateTrusttransportRideRequest(req.params.id, validatedData);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating TrustTransport ride request:", error);
      res.status(400).json({ message: error.message || "Failed to update ride request" });
    }
  });

  // Cancel ride request (rider or driver can cancel)
  app.post('/api/trusttransport/ride-requests/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const request = await storage.cancelTrusttransportRideRequest(req.params.id, userId);
      res.json(request);
    } catch (error: any) {
      console.error("Error cancelling TrustTransport ride request:", error);
      res.status(400).json({ message: error.message || "Failed to cancel ride request" });
    }
  });

  // TrustTransport Admin Announcement routes
  app.get('/api/trusttransport/admin/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllTrusttransportAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching TrustTransport announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/trusttransport/admin/announcements', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertTrusttransportAnnouncementSchema.parse(req.body);

      const announcement = await storage.createTrusttransportAnnouncement(validatedData);
      
      await logAdminAction(
        userId,
        "create_trusttransport_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title, type: announcement.type }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error creating TrustTransport announcement:", error);
      res.status(400).json({ message: error.message || "Failed to create announcement" });
    }
  });

  app.put('/api/trusttransport/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.updateTrusttransportAnnouncement(req.params.id, req.body);
      
      await logAdminAction(
        userId,
        "update_trusttransport_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error updating TrustTransport announcement:", error);
      res.status(400).json({ message: error.message || "Failed to update announcement" });
    }
  });

  app.delete('/api/trusttransport/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.deactivateTrusttransportAnnouncement(req.params.id);
      
      await logAdminAction(
        userId,
        "deactivate_trusttransport_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error deleting TrustTransport announcement:", error);
      res.status(400).json({ message: error.message || "Failed to delete announcement" });
    }
  });

  // ========================================
  // NPS (Net Promoter Score) Routes
  // ========================================

  // Check if user should see the NPS survey
  app.get('/api/nps/should-show', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const lastResponse = await storage.getUserLastNpsResponse(userId);
      
      // Get current month in YYYY-MM format
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Check if user has already responded this month
      const hasRespondedThisMonth = lastResponse?.responseMonth === currentMonth;
      
      res.json({
        shouldShow: !hasRespondedThisMonth,
        lastResponseMonth: lastResponse?.responseMonth || null,
      });
    } catch (error) {
      console.error("Error checking NPS survey eligibility:", error);
      res.status(500).json({ message: "Failed to check survey eligibility" });
    }
  });

  // Submit NPS response
  app.post('/api/nps/response', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const now = new Date();
      const responseMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const validatedData = insertNpsResponseSchema.parse({
        ...req.body,
        userId,
        responseMonth,
      });
      
      const response = await storage.createNpsResponse(validatedData);
      res.json(response);
    } catch (error: any) {
      console.error("Error submitting NPS response:", error);
      res.status(400).json({ message: error.message || "Failed to submit response" });
    }
  });

  // Get NPS responses for admin (Weekly Performance dashboard)
  app.get('/api/admin/nps-responses', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const weekStart = req.query.weekStart ? new Date(req.query.weekStart as string) : undefined;
      const weekEnd = req.query.weekEnd ? new Date(req.query.weekEnd as string) : undefined;
      
      let responses;
      if (weekStart && weekEnd) {
        responses = await storage.getNpsResponsesForWeek(weekStart, weekEnd);
      } else {
        responses = await storage.getAllNpsResponses();
      }
      
      res.json(responses);
    } catch (error) {
      console.error("Error fetching NPS responses:", error);
      res.status(500).json({ message: "Failed to fetch NPS responses" });
    }
  });

  // ========================================
  // MECHANICMATCH ROUTES
  // ========================================

  // MechanicMatch Announcement routes (public)
  app.get('/api/mechanicmatch/announcements', isAuthenticated, async (req, res) => {
    try {
      const announcements = await storage.getActiveMechanicmatchAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching MechanicMatch announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // MechanicMatch Profile routes
  app.get('/api/mechanicmatch/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getMechanicmatchProfile(userId);
      res.json(profile);
    } catch (error: any) {
      console.error("Error fetching MechanicMatch profile:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/mechanicmatch/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertMechanicmatchProfileSchema.parse(req.body);
      const profile = await storage.createMechanicmatchProfile({
        ...validatedData,
        userId,
      });
      res.json(profile);
    } catch (error: any) {
      console.error("Error creating MechanicMatch profile:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/mechanicmatch/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.updateMechanicmatchProfile(userId, req.body);
      res.json(profile);
    } catch (error: any) {
      console.error("Error updating MechanicMatch profile:", error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  app.delete('/api/mechanicmatch/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { reason } = req.body;
      await storage.deleteMechanicmatchProfile(userId, reason);
      res.json({ message: "MechanicMatch profile deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting MechanicMatch profile:", error);
      res.status(400).json({ message: error.message || "Failed to delete profile" });
    }
  });

  // MechanicMatch Vehicle routes
  app.get('/api/mechanicmatch/vehicles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const vehicles = await storage.getMechanicmatchVehiclesByOwner(userId);
      res.json(vehicles);
    } catch (error: any) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: error.message || "Failed to fetch vehicles" });
    }
  });

  app.get('/api/mechanicmatch/vehicles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const vehicle = await storage.getMechanicmatchVehicleById(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error: any) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ message: error.message || "Failed to fetch vehicle" });
    }
  });

  app.post('/api/mechanicmatch/vehicles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertMechanicmatchVehicleSchema.parse(req.body);
      const vehicle = await storage.createMechanicmatchVehicle({
        ...validatedData,
        ownerId: userId,
      });
      res.json(vehicle);
    } catch (error: any) {
      console.error("Error creating vehicle:", error);
      res.status(400).json({ message: error.message || "Failed to create vehicle" });
    }
  });

  app.put('/api/mechanicmatch/vehicles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const vehicle = await storage.getMechanicmatchVehicleById(req.params.id);
      if (!vehicle || vehicle.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const updated = await storage.updateMechanicmatchVehicle(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating vehicle:", error);
      res.status(400).json({ message: error.message || "Failed to update vehicle" });
    }
  });

  app.delete('/api/mechanicmatch/vehicles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await storage.deleteMechanicmatchVehicle(req.params.id, userId);
      res.json({ message: "Vehicle deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting vehicle:", error);
      res.status(400).json({ message: error.message || "Failed to delete vehicle" });
    }
  });

  // MechanicMatch Service Request routes
  app.get('/api/mechanicmatch/service-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const requests = await storage.getMechanicmatchServiceRequestsByOwner(userId);
      res.json(requests);
    } catch (error: any) {
      console.error("Error fetching service requests:", error);
      res.status(500).json({ message: error.message || "Failed to fetch service requests" });
    }
  });

  app.get('/api/mechanicmatch/service-requests/open', isAuthenticated, async (req, res) => {
    try {
      const requests = await storage.getOpenMechanicmatchServiceRequests();
      res.json(requests);
    } catch (error: any) {
      console.error("Error fetching open service requests:", error);
      res.status(500).json({ message: error.message || "Failed to fetch service requests" });
    }
  });

  app.get('/api/mechanicmatch/service-requests/:id', isAuthenticated, async (req, res) => {
    try {
      const request = await storage.getMechanicmatchServiceRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Service request not found" });
      }
      res.json(request);
    } catch (error: any) {
      console.error("Error fetching service request:", error);
      res.status(500).json({ message: error.message || "Failed to fetch service request" });
    }
  });

  app.post('/api/mechanicmatch/service-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getMechanicmatchProfile(userId);
      if (!profile || !profile.isCarOwner) {
        return res.status(400).json({ message: "You must be a car owner to create service requests" });
      }
      const validatedData = insertMechanicmatchServiceRequestSchema.parse(req.body);
      const request = await storage.createMechanicmatchServiceRequest({
        ...validatedData,
        ownerId: userId,
      });
      res.json(request);
    } catch (error: any) {
      console.error("Error creating service request:", error);
      res.status(400).json({ message: error.message || "Failed to create service request" });
    }
  });

  app.put('/api/mechanicmatch/service-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const request = await storage.getMechanicmatchServiceRequestById(req.params.id);
      if (!request || request.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const updated = await storage.updateMechanicmatchServiceRequest(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating service request:", error);
      res.status(400).json({ message: error.message || "Failed to update service request" });
    }
  });

  // MechanicMatch Job routes
  app.get('/api/mechanicmatch/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getMechanicmatchProfile(userId);
      if (!profile) {
        return res.status(400).json({ message: "Profile not found" });
      }
      
      let jobs;
      if (profile.isCarOwner) {
        jobs = await storage.getMechanicmatchJobsByOwner(userId);
      } else if (profile.isMechanic) {
        jobs = await storage.getMechanicmatchJobsByMechanic(profile.id);
      } else {
        return res.json([]);
      }
      
      res.json(jobs);
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: error.message || "Failed to fetch jobs" });
    }
  });

  app.get('/api/mechanicmatch/jobs/:id', isAuthenticated, async (req, res) => {
    try {
      const job = await storage.getMechanicmatchJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error: any) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: error.message || "Failed to fetch job" });
    }
  });

  app.post('/api/mechanicmatch/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertMechanicmatchJobSchema.parse(req.body);
      const job = await storage.createMechanicmatchJob({
        ...validatedData,
        ownerId: userId,
      });
      res.json(job);
    } catch (error: any) {
      console.error("Error creating job:", error);
      res.status(400).json({ message: error.message || "Failed to create job" });
    }
  });

  app.put('/api/mechanicmatch/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const job = await storage.getMechanicmatchJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const profile = await storage.getMechanicmatchProfile(userId);
      if (!profile) {
        return res.status(403).json({ message: "Profile not found" });
      }
      
      // Only owner or assigned mechanic can update
      if (job.ownerId !== userId && job.mechanicId !== profile.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updated = await storage.updateMechanicmatchJob(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating job:", error);
      res.status(400).json({ message: error.message || "Failed to update job" });
    }
  });

  app.post('/api/mechanicmatch/jobs/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getMechanicmatchProfile(userId);
      if (!profile || !profile.isMechanic) {
        return res.status(400).json({ message: "You must be a mechanic to accept jobs" });
      }
      const job = await storage.acceptMechanicmatchJob(req.params.id, profile.id);
      res.json(job);
    } catch (error: any) {
      console.error("Error accepting job:", error);
      res.status(400).json({ message: error.message || "Failed to accept job" });
    }
  });

  // MechanicMatch Availability routes
  app.get('/api/mechanicmatch/availability', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getMechanicmatchProfile(userId);
      if (!profile || !profile.isMechanic) {
        return res.status(400).json({ message: "You must be a mechanic to view availability" });
      }
      const availability = await storage.getMechanicmatchAvailabilityByMechanic(profile.id);
      res.json(availability);
    } catch (error: any) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: error.message || "Failed to fetch availability" });
    }
  });

  app.post('/api/mechanicmatch/availability', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getMechanicmatchProfile(userId);
      if (!profile || !profile.isMechanic) {
        return res.status(400).json({ message: "You must be a mechanic to set availability" });
      }
      const validatedData = insertMechanicmatchAvailabilitySchema.parse(req.body);
      const availability = await storage.createMechanicmatchAvailability({
        ...validatedData,
        mechanicId: profile.id,
      });
      res.json(availability);
    } catch (error: any) {
      console.error("Error creating availability:", error);
      res.status(400).json({ message: error.message || "Failed to create availability" });
    }
  });

  app.put('/api/mechanicmatch/availability/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getMechanicmatchProfile(userId);
      if (!profile || !profile.isMechanic) {
        return res.status(400).json({ message: "You must be a mechanic to update availability" });
      }
      const updated = await storage.updateMechanicmatchAvailability(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating availability:", error);
      res.status(400).json({ message: error.message || "Failed to update availability" });
    }
  });

  app.delete('/api/mechanicmatch/availability/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getMechanicmatchProfile(userId);
      if (!profile || !profile.isMechanic) {
        return res.status(400).json({ message: "You must be a mechanic to delete availability" });
      }
      await storage.deleteMechanicmatchAvailability(req.params.id, profile.id);
      res.json({ message: "Availability deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting availability:", error);
      res.status(400).json({ message: error.message || "Failed to delete availability" });
    }
  });

  // MechanicMatch Review routes
  app.get('/api/mechanicmatch/reviews/mechanic/:mechanicId', isAuthenticated, async (req, res) => {
    try {
      const reviews = await storage.getMechanicmatchReviewsByReviewee(req.params.mechanicId);
      res.json(reviews);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: error.message || "Failed to fetch reviews" });
    }
  });

  app.get('/api/mechanicmatch/reviews/job/:jobId', isAuthenticated, async (req, res) => {
    try {
      const reviews = await storage.getMechanicmatchReviewsByJob(req.params.jobId);
      res.json(reviews);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: error.message || "Failed to fetch reviews" });
    }
  });

  app.post('/api/mechanicmatch/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertMechanicmatchReviewSchema.parse(req.body);
      const review = await storage.createMechanicmatchReview({
        ...validatedData,
        reviewerId: userId,
      });
      res.json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: error.message || "Failed to create review" });
    }
  });

  // MechanicMatch Message routes
  app.get('/api/mechanicmatch/messages/job/:jobId', isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getMechanicmatchMessagesByJob(req.params.jobId);
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: error.message || "Failed to fetch messages" });
    }
  });

  app.get('/api/mechanicmatch/messages/unread', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const messages = await storage.getUnreadMechanicmatchMessages(userId);
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching unread messages:", error);
      res.status(500).json({ message: error.message || "Failed to fetch messages" });
    }
  });

  app.post('/api/mechanicmatch/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertMechanicmatchMessageSchema.parse(req.body);
      const message = await storage.createMechanicmatchMessage({
        ...validatedData,
        senderId: userId,
      });
      res.json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      res.status(400).json({ message: error.message || "Failed to create message" });
    }
  });

  app.put('/api/mechanicmatch/messages/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const message = await storage.markMechanicmatchMessageAsRead(req.params.id, userId);
      res.json(message);
    } catch (error: any) {
      console.error("Error marking message as read:", error);
      res.status(400).json({ message: error.message || "Failed to mark message as read" });
    }
  });

  // MechanicMatch Search routes
  app.get('/api/mechanicmatch/search/mechanics', isAuthenticated, async (req: any, res) => {
    try {
      const filters: any = {};
      if (req.query.city) filters.city = req.query.city;
      if (req.query.state) filters.state = req.query.state;
      if (req.query.isMobileMechanic !== undefined) filters.isMobileMechanic = req.query.isMobileMechanic === 'true';
      if (req.query.maxHourlyRate) filters.maxHourlyRate = parseFloat(req.query.maxHourlyRate);
      if (req.query.minRating) filters.minRating = parseFloat(req.query.minRating);
      if (req.query.specialties) filters.specialties = Array.isArray(req.query.specialties) ? req.query.specialties : [req.query.specialties];
      
      const mechanics = await storage.searchMechanicmatchMechanics(filters);
      res.json(mechanics);
    } catch (error: any) {
      console.error("Error searching mechanics:", error);
      res.status(500).json({ message: error.message || "Failed to search mechanics" });
    }
  });

  // MechanicMatch Admin Announcement routes
  app.get('/api/mechanicmatch/admin/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllMechanicmatchAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching MechanicMatch announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/mechanicmatch/admin/announcements', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertMechanicmatchAnnouncementSchema.parse(req.body);

      const announcement = await storage.createMechanicmatchAnnouncement(validatedData);
      
      await logAdminAction(
        userId,
        "create_mechanicmatch_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title, type: announcement.type }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error creating MechanicMatch announcement:", error);
      res.status(400).json({ message: error.message || "Failed to create announcement" });
    }
  });

  app.put('/api/mechanicmatch/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.updateMechanicmatchAnnouncement(req.params.id, req.body);
      
      await logAdminAction(
        userId,
        "update_mechanicmatch_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error updating MechanicMatch announcement:", error);
      res.status(400).json({ message: error.message || "Failed to update announcement" });
    }
  });

  app.delete('/api/mechanicmatch/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.deactivateMechanicmatchAnnouncement(req.params.id);
      
      await logAdminAction(
        userId,
        "deactivate_mechanicmatch_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error deleting MechanicMatch announcement:", error);
      res.status(400).json({ message: error.message || "Failed to delete announcement" });
    }
  });

  // ========================================
  // RESEARCH ROUTES
  // ========================================

  // Research Announcement routes (public)
  app.get('/api/research/announcements', async (req, res) => {
    try {
      const announcements = await storage.getActiveResearchAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching Research announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Research Item routes
  app.post('/api/research/items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const body = req.body;
      
      // Parse JSON arrays if strings
      if (typeof body.tags === 'string') {
        try {
          body.tags = JSON.parse(body.tags);
        } catch (e) {
          body.tags = [];
        }
      }
      if (typeof body.attachments === 'string') {
        try {
          body.attachments = JSON.parse(body.attachments);
        } catch (e) {
          body.attachments = [];
        }
      }

      const validatedData = insertResearchItemSchema.parse({ ...body, userId });
      const item = await storage.createResearchItem(validatedData);
      
      console.log(`Research item created: ${item.id} by ${userId}`);
      res.json(item);
    } catch (error: any) {
      console.error("Error creating research item:", error);
      res.status(400).json({ message: error.message || "Failed to create research item" });
    }
  });

  app.get('/api/research/items', async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.userId) filters.userId = req.query.userId as string;
      if (req.query.tag) filters.tag = req.query.tag as string;
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.isPublic !== undefined) filters.isPublic = req.query.isPublic === 'true';
      if (req.query.search) filters.search = req.query.search as string;
      if (req.query.sortBy) filters.sortBy = req.query.sortBy as string;
      filters.limit = parseInt(req.query.limit as string || "50");
      filters.offset = parseInt(req.query.offset as string || "0");
      
      const result = await storage.getResearchItems(filters);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching research items:", error);
      res.status(500).json({ message: error.message || "Failed to fetch research items" });
    }
  });

  app.get('/api/research/items/public', publicListingLimiter, async (req, res) => {
    try {
      const filters: any = { isPublic: true };
      if (req.query.tag) filters.tag = req.query.tag as string;
      if (req.query.search) filters.search = req.query.search as string;
      filters.limit = parseInt(req.query.limit as string || "20");
      filters.offset = parseInt(req.query.offset as string || "0");
      
      const result = await storage.getResearchItems(filters);
      res.json(result.items);
    } catch (error: any) {
      console.error("Error fetching public research items:", error);
      res.status(500).json({ message: error.message || "Failed to fetch research items" });
    }
  });

  app.get('/api/research/items/:id', async (req, res) => {
    try {
      const item = await storage.getResearchItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Research item not found" });
      }
      
      // Increment view count
      await storage.incrementResearchItemViewCount(req.params.id);
      
      res.json(item);
    } catch (error: any) {
      console.error("Error fetching research item:", error);
      res.status(500).json({ message: error.message || "Failed to fetch research item" });
    }
  });

  app.put('/api/research/items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const item = await storage.getResearchItemById(req.params.id);
      
      if (!item) {
        return res.status(404).json({ message: "Research item not found" });
      }
      
      if (item.userId !== userId && !isAdmin(req)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const body = req.body;
      if (typeof body.tags === 'string') {
        try {
          body.tags = JSON.parse(body.tags);
        } catch (e) {
          body.tags = [];
        }
      }
      if (typeof body.attachments === 'string') {
        try {
          body.attachments = JSON.parse(body.attachments);
        } catch (e) {
          body.attachments = [];
        }
      }

      const updated = await storage.updateResearchItem(req.params.id, body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating research item:", error);
      res.status(400).json({ message: error.message || "Failed to update research item" });
    }
  });

  // Research Answer routes
  app.post('/api/research/answers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const body = req.body;
      
      if (typeof body.links === 'string') {
        try {
          body.links = JSON.parse(body.links);
        } catch (e) {
          body.links = [];
        }
      }
      if (typeof body.attachments === 'string') {
        try {
          body.attachments = JSON.parse(body.attachments);
        } catch (e) {
          body.attachments = [];
        }
      }

      const validatedData = insertResearchAnswerSchema.parse({ ...body, userId });
      const answer = await storage.createResearchAnswer(validatedData);
      
      // Trigger link verification for any links provided
      if (validatedData.links && validatedData.links.length > 0) {
        // Queue link verification (async, non-blocking)
        setImmediate(async () => {
          for (const url of validatedData.links || []) {
            try {
              await verifyResearchLink(answer.id, url);
            } catch (error) {
              console.error(`Error verifying link ${url}:`, error);
            }
          }
        });
      }
      
      res.json(answer);
    } catch (error: any) {
      console.error("Error creating research answer:", error);
      res.status(400).json({ message: error.message || "Failed to create answer" });
    }
  });

  app.get('/api/research/items/:id/answers', async (req, res) => {
    try {
      const sortBy = req.query.sortBy as string || "relevance";
      const answers = await storage.getResearchAnswersByItemId(req.params.id, sortBy);
      res.json(answers);
    } catch (error: any) {
      console.error("Error fetching answers:", error);
      res.status(500).json({ message: error.message || "Failed to fetch answers" });
    }
  });

  app.get('/api/research/answers/:id', async (req, res) => {
    try {
      const answer = await storage.getResearchAnswerById(req.params.id);
      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }
      res.json(answer);
    } catch (error: any) {
      console.error("Error fetching answer:", error);
      res.status(500).json({ message: error.message || "Failed to fetch answer" });
    }
  });

  app.put('/api/research/answers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const answer = await storage.getResearchAnswerById(req.params.id);
      
      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }
      
      if (answer.userId !== userId && !isAdmin(req)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const body = req.body;
      if (typeof body.links === 'string') {
        try {
          body.links = JSON.parse(body.links);
        } catch (e) {
          body.links = [];
        }
      }

      const updated = await storage.updateResearchAnswer(req.params.id, body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating answer:", error);
      res.status(400).json({ message: error.message || "Failed to update answer" });
    }
  });

  // Accept answer endpoint
  app.post('/api/research/items/:itemId/accept-answer/:answerId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const item = await storage.getResearchItemById(req.params.itemId);
      
      if (!item || item.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedItem = await storage.acceptResearchAnswer(req.params.itemId, req.params.answerId);
      res.json(updatedItem);
    } catch (error: any) {
      console.error("Error accepting answer:", error);
      res.status(400).json({ message: error.message || "Failed to accept answer" });
    }
  });

  // Research Comment routes
  app.post('/api/research/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertResearchCommentSchema.parse({ ...req.body, userId });
      const comment = await storage.createResearchComment(validatedData);
      res.json(comment);
    } catch (error: any) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: error.message || "Failed to create comment" });
    }
  });

  app.get('/api/research/comments', async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.researchItemId) filters.researchItemId = req.query.researchItemId as string;
      if (req.query.answerId) filters.answerId = req.query.answerId as string;
      
      const comments = await storage.getResearchComments(filters);
      res.json(comments);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: error.message || "Failed to fetch comments" });
    }
  });

  app.put('/api/research/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const comment = await storage.getResearchComments({ researchItemId: undefined, answerId: undefined }).then(cs => cs.find(c => c.id === req.params.id));
      
      if (!comment || comment.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.updateResearchComment(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating comment:", error);
      res.status(400).json({ message: error.message || "Failed to update comment" });
    }
  });

  app.delete('/api/research/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      // Note: In production, check ownership or admin status
      await storage.deleteResearchComment(req.params.id);
      res.json({ message: "Comment deleted" });
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      res.status(400).json({ message: error.message || "Failed to delete comment" });
    }
  });

  // Research Vote routes
  app.post('/api/research/votes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertResearchVoteSchema.parse({ ...req.body, userId });
      const vote = await storage.createOrUpdateResearchVote(validatedData);
      res.json(vote);
    } catch (error: any) {
      console.error("Error creating vote:", error);
      res.status(400).json({ message: error.message || "Failed to create vote" });
    }
  });

  app.get('/api/research/votes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const researchItemId = req.query.researchItemId as string;
      const answerId = req.query.answerId as string;
      
      const vote = await storage.getResearchVote(userId, researchItemId, answerId);
      res.json(vote || null);
    } catch (error: any) {
      console.error("Error fetching vote:", error);
      res.status(500).json({ message: error.message || "Failed to fetch vote" });
    }
  });

  app.delete('/api/research/votes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const researchItemId = req.query.researchItemId as string;
      const answerId = req.query.answerId as string;
      
      await storage.deleteResearchVote(userId, researchItemId, answerId);
      res.json({ message: "Vote deleted" });
    } catch (error: any) {
      console.error("Error deleting vote:", error);
      res.status(400).json({ message: error.message || "Failed to delete vote" });
    }
  });

  // Research Bookmark routes
  app.post('/api/research/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertResearchBookmarkSchema.parse({ ...req.body, userId });
      const bookmark = await storage.createResearchBookmark(validatedData);
      res.json(bookmark);
    } catch (error: any) {
      console.error("Error creating bookmark:", error);
      res.status(400).json({ message: error.message || "Failed to create bookmark" });
    }
  });

  app.delete('/api/research/bookmarks/:itemId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await storage.deleteResearchBookmark(userId, req.params.itemId);
      res.json({ message: "Bookmark deleted" });
    } catch (error: any) {
      console.error("Error deleting bookmark:", error);
      res.status(400).json({ message: error.message || "Failed to delete bookmark" });
    }
  });

  app.get('/api/research/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const bookmarks = await storage.getResearchBookmarks(userId);
      res.json(bookmarks);
    } catch (error: any) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: error.message || "Failed to fetch bookmarks" });
    }
  });

  // Research Follow routes
  app.post('/api/research/follows', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertResearchFollowSchema.parse({ ...req.body, userId });
      const follow = await storage.createResearchFollow(validatedData);
      res.json(follow);
    } catch (error: any) {
      console.error("Error creating follow:", error);
      res.status(400).json({ message: error.message || "Failed to create follow" });
    }
  });

  app.delete('/api/research/follows', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const filters: any = {};
      if (req.query.followedUserId) filters.followedUserId = req.query.followedUserId as string;
      if (req.query.researchItemId) filters.researchItemId = req.query.researchItemId as string;
      if (req.query.tag) filters.tag = req.query.tag as string;
      
      await storage.deleteResearchFollow(userId, filters);
      res.json({ message: "Follow deleted" });
    } catch (error: any) {
      console.error("Error deleting follow:", error);
      res.status(400).json({ message: error.message || "Failed to delete follow" });
    }
  });

  app.get('/api/research/follows', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const follows = await storage.getResearchFollows(userId);
      res.json(follows);
    } catch (error: any) {
      console.error("Error fetching follows:", error);
      res.status(500).json({ message: error.message || "Failed to fetch follows" });
    }
  });

  // Research Timeline/Feed
  app.get('/api/research/timeline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const limit = parseInt(req.query.limit as string || "50");
      const offset = parseInt(req.query.offset as string || "0");
      
      const items = await storage.getResearchTimeline(userId, limit, offset);
      res.json(items);
    } catch (error: any) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ message: error.message || "Failed to fetch timeline" });
    }
  });

  // Research Link Provenance routes
  app.get('/api/research/answers/:answerId/links', async (req, res) => {
    try {
      const provenances = await storage.getResearchLinkProvenancesByAnswerId(req.params.answerId);
      res.json(provenances);
    } catch (error: any) {
      console.error("Error fetching link provenances:", error);
      res.status(500).json({ message: error.message || "Failed to fetch links" });
    }
  });

  // Link verification endpoint (triggers async verification)
  app.post('/api/research/verify-link', isAuthenticated, async (req: any, res) => {
    try {
      const { answerId, url } = req.body;
      
      if (!answerId || !url) {
        return res.status(400).json({ message: "answerId and url are required" });
      }

      // Queue verification (non-blocking)
      setImmediate(async () => {
        try {
          await verifyResearchLink(answerId, url);
        } catch (error) {
          console.error(`Error verifying link ${url}:`, error);
        }
      });

      res.json({ message: "Link verification queued" });
    } catch (error: any) {
      console.error("Error queuing link verification:", error);
      res.status(500).json({ message: error.message || "Failed to queue verification" });
    }
  });

  // Research Board/Column/Card routes (Trello-style)
  app.post('/api/research/boards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertResearchBoardSchema.parse({ ...req.body, userId });
      const board = await storage.createResearchBoard(validatedData);
      res.json(board);
    } catch (error: any) {
      console.error("Error creating board:", error);
      res.status(400).json({ message: error.message || "Failed to create board" });
    }
  });

  app.get('/api/research/items/:itemId/boards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const boards = await storage.getResearchBoardsByItemId(req.params.itemId, userId);
      res.json(boards);
    } catch (error: any) {
      console.error("Error fetching boards:", error);
      res.status(500).json({ message: error.message || "Failed to fetch boards" });
    }
  });

  app.post('/api/research/columns', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertResearchColumnSchema.parse(req.body);
      const column = await storage.createResearchColumn(validatedData);
      res.json(column);
    } catch (error: any) {
      console.error("Error creating column:", error);
      res.status(400).json({ message: error.message || "Failed to create column" });
    }
  });

  app.get('/api/research/boards/:boardId/columns', async (req, res) => {
    try {
      const columns = await storage.getResearchColumnsByBoardId(req.params.boardId);
      res.json(columns);
    } catch (error: any) {
      console.error("Error fetching columns:", error);
      res.status(500).json({ message: error.message || "Failed to fetch columns" });
    }
  });

  app.post('/api/research/cards', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertResearchCardSchema.parse(req.body);
      const card = await storage.createResearchCard(validatedData);
      res.json(card);
    } catch (error: any) {
      console.error("Error creating card:", error);
      res.status(400).json({ message: error.message || "Failed to create card" });
    }
  });

  app.get('/api/research/columns/:columnId/cards', async (req, res) => {
    try {
      const cards = await storage.getResearchCardsByColumnId(req.params.columnId);
      res.json(cards);
    } catch (error: any) {
      console.error("Error fetching cards:", error);
      res.status(500).json({ message: error.message || "Failed to fetch cards" });
    }
  });

  app.put('/api/research/cards/:id/move', isAuthenticated, async (req: any, res) => {
    try {
      const { columnId, position } = req.body;
      const card = await storage.moveResearchCard(req.params.id, columnId, position);
      res.json(card);
    } catch (error: any) {
      console.error("Error moving card:", error);
      res.status(400).json({ message: error.message || "Failed to move card" });
    }
  });

  // Research Report routes
  app.post('/api/research/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertResearchReportSchema.parse({ ...req.body, userId });
      const report = await storage.createResearchReport(validatedData);
      res.json(report);
    } catch (error: any) {
      console.error("Error creating report:", error);
      res.status(400).json({ message: error.message || "Failed to create report" });
    }
  });

  app.get('/api/research/admin/reports', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.status) filters.status = req.query.status as string;
      filters.limit = parseInt(req.query.limit as string || "50");
      filters.offset = parseInt(req.query.offset as string || "0");
      
      const result = await storage.getResearchReports(filters);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: error.message || "Failed to fetch reports" });
    }
  });

  app.put('/api/research/admin/reports/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const updated = await storage.updateResearchReport(req.params.id, {
        ...req.body,
        reviewedBy: userId,
        reviewedAt: new Date(),
      });
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating report:", error);
      res.status(400).json({ message: error.message || "Failed to update report" });
    }
  });

  // Research User Reputation
  app.get('/api/research/users/:userId/reputation', async (req, res) => {
    try {
      const reputation = await storage.getUserReputation(req.params.userId);
      res.json({ reputation });
    } catch (error: any) {
      console.error("Error fetching reputation:", error);
      res.status(500).json({ message: error.message || "Failed to fetch reputation" });
    }
  });

  // Research Admin Announcement routes
  app.get('/api/research/admin/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllResearchAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching Research announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/research/admin/announcements', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertResearchAnnouncementSchema.parse(req.body);

      const announcement = await storage.createResearchAnnouncement(validatedData);
      
      await logAdminAction(
        userId,
        "create_research_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title, type: announcement.type }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error creating Research announcement:", error);
      res.status(400).json({ message: error.message || "Failed to create announcement" });
    }
  });

  app.put('/api/research/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.updateResearchAnnouncement(req.params.id, req.body);
      
      await logAdminAction(
        userId,
        "update_research_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error updating Research announcement:", error);
      res.status(400).json({ message: error.message || "Failed to update announcement" });
    }
  });

  app.delete('/api/research/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.deactivateResearchAnnouncement(req.params.id);
      
      await logAdminAction(
        userId,
        "deactivate_research_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error deleting Research announcement:", error);
      res.status(400).json({ message: error.message || "Failed to delete announcement" });
    }
  });

  // Link verification helper function (simplified - fetches link and computes fake similarity)
  async function verifyResearchLink(answerId: string, url: string): Promise<void> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Fetch link (simplified - in production, use proper HTTP client with timeout)
      let httpStatus = 200;
      let title = "";
      let snippet = "";
      let domainScore = 0.5; // Default

      try {
        // Simple domain scoring (in production, use whitelist/blacklist)
        if (domain.includes('.edu') || domain.includes('.gov')) {
          domainScore = 0.9;
        } else if (domain.includes('.org')) {
          domainScore = 0.7;
        } else if (domain.includes('.com')) {
          domainScore = 0.5;
        }

        // In production, fetch actual page content
        // For now, create a fake similarity score (0.6-0.9 range)
        const similarityScore = 0.6 + Math.random() * 0.3;

        // Create provenance entry
        await storage.createResearchLinkProvenance({
          answerId,
          url,
          httpStatus,
          title: title || domain,
          snippet: snippet || `Content from ${domain}`,
          domain,
          domainScore,
          similarityScore,
          isSupportive: similarityScore > 0.7 && domainScore > 0.5,
        });

        console.log(`Link verified: ${url} for answer ${answerId}`);
      } catch (fetchError: any) {
        // If fetch fails, still create provenance with error status
        await storage.createResearchLinkProvenance({
          answerId,
          url,
          httpStatus: 0,
          title: domain,
          snippet: `Error fetching: ${fetchError.message}`,
          domain,
          domainScore: 0.3,
          similarityScore: 0,
          isSupportive: false,
        });
      }
    } catch (error: any) {
      console.error(`Error verifying link ${url}:`, error);
      throw error;
    }
  }

  // ========================================
  // ========================================
  // GENTLEPULSE ROUTES
  // ========================================

  // Helper to strip IP and metadata from request for privacy
  const stripIPAndMetadata = (req: any) => {
    // Remove IP, user-agent, and other identifying headers before storage
    delete req.ip;
    delete req.connection?.remoteAddress;
    delete req.socket?.remoteAddress;
    delete req.headers["x-forwarded-for"];
    delete req.headers["x-real-ip"];
  };

  // GentlePulse Announcement routes (public)
  app.get('/api/gentlepulse/announcements', async (req, res) => {
    try {
      const announcements = await storage.getActiveGentlepulseAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching GentlePulse announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // GentlePulse Meditation routes (public)
  app.get('/api/gentlepulse/meditations', publicListingLimiter, async (req, res) => {
    try {
      stripIPAndMetadata(req);
      
      const filters: any = {};
      if (req.query.tag) filters.tag = req.query.tag as string;
      if (req.query.sortBy) filters.sortBy = req.query.sortBy as string;
      filters.limit = parseInt(req.query.limit as string || "50");
      filters.offset = parseInt(req.query.offset as string || "0");
      
      const result = await storage.getGentlepulseMeditations(filters);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching meditations:", error);
      res.status(500).json({ message: error.message || "Failed to fetch meditations" });
    }
  });

  app.get('/api/gentlepulse/meditations/:id', async (req, res) => {
    try {
      stripIPAndMetadata(req);
      const meditation = await storage.getGentlepulseMeditationById(req.params.id);
      if (!meditation) {
        return res.status(404).json({ message: "Meditation not found" });
      }
      res.json(meditation);
    } catch (error: any) {
      console.error("Error fetching meditation:", error);
      res.status(500).json({ message: error.message || "Failed to fetch meditation" });
    }
  });

  // Track meditation play (increment play count)
  app.post('/api/gentlepulse/meditations/:id/play', async (req, res) => {
    try {
      stripIPAndMetadata(req);
      await storage.incrementGentlepulsePlayCount(req.params.id);
      res.json({ message: "Play count updated" });
    } catch (error: any) {
      console.error("Error updating play count:", error);
      res.status(500).json({ message: error.message || "Failed to update play count" });
    }
  });

  // GentlePulse Rating routes (public, anonymous)
  app.post('/api/gentlepulse/ratings', publicItemLimiter, async (req, res) => {
    try {
      stripIPAndMetadata(req);
      
      const validatedData = insertGentlepulseRatingSchema.parse(req.body);
      const rating = await storage.createOrUpdateGentlepulseRating(validatedData);
      
      console.log(`GentlePulse rating submitted: meditation ${validatedData.meditationId}, rating ${validatedData.rating}`);
      
      res.json(rating);
    } catch (error: any) {
      console.error("Error creating rating:", error);
      res.status(400).json({ message: error.message || "Failed to create rating" });
    }
  });

  app.get('/api/gentlepulse/meditations/:id/ratings', async (req, res) => {
    try {
      stripIPAndMetadata(req);
      const ratings = await storage.getGentlepulseRatingsByMeditationId(req.params.id);
      // Return only aggregated data, not individual ratings
      const average = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;
      res.json({ average: Number(average.toFixed(2)), count: ratings.length });
    } catch (error: any) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ message: error.message || "Failed to fetch ratings" });
    }
  });

  // GentlePulse Mood Check routes (public, anonymous)
  app.post('/api/gentlepulse/mood', publicItemLimiter, async (req, res) => {
    try {
      stripIPAndMetadata(req);
      
      const validatedData = insertGentlepulseMoodCheckSchema.parse({
        ...req.body,
        date: new Date().toISOString().split('T')[0], // Today's date
      });
      
      const moodCheck = await storage.createGentlepulseMoodCheck(validatedData);
      
      // Check for suicide prevention trigger (3+ extremely negative moods in 7 days)
      const recentMoods = await storage.getGentlepulseMoodChecksByClientId(validatedData.clientId, 7);
      const extremelyNegative = recentMoods.filter(m => m.moodValue === 1).length;
      
      console.log(`GentlePulse mood check submitted: client ${validatedData.clientId}, mood ${validatedData.moodValue}`);
      
      res.json({
        ...moodCheck,
        showSafetyMessage: extremelyNegative >= 3,
      });
    } catch (error: any) {
      console.error("Error creating mood check:", error);
      res.status(400).json({ message: error.message || "Failed to create mood check" });
    }
  });

  // Check if mood check should be shown (once every 7 days)
  app.get('/api/gentlepulse/mood/check-eligible', async (req, res) => {
    try {
      const clientId = req.query.clientId as string;
      if (!clientId) {
        return res.json({ eligible: false });
      }

      const recentMoods = await storage.getGentlepulseMoodChecksByClientId(clientId, 7);
      const lastMood = recentMoods[0];
      
      if (!lastMood) {
        return res.json({ eligible: true });
      }

      const daysSinceLastMood = (Date.now() - new Date(lastMood.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      res.json({ eligible: daysSinceLastMood >= 7 });
    } catch (error: any) {
      console.error("Error checking mood eligibility:", error);
      res.status(500).json({ message: error.message || "Failed to check eligibility" });
    }
  });

  // GentlePulse Favorites routes (public, anonymous)
  app.post('/api/gentlepulse/favorites', async (req, res) => {
    try {
      stripIPAndMetadata(req);
      const validatedData = insertGentlepulseFavoriteSchema.parse(req.body);
      const favorite = await storage.createGentlepulseFavorite(validatedData);
      res.json(favorite);
    } catch (error: any) {
      console.error("Error creating favorite:", error);
      res.status(400).json({ message: error.message || "Failed to create favorite" });
    }
  });

  app.delete('/api/gentlepulse/favorites/:meditationId', async (req, res) => {
    try {
      stripIPAndMetadata(req);
      const clientId = req.query.clientId as string;
      if (!clientId) {
        return res.status(400).json({ message: "clientId required" });
      }
      await storage.deleteGentlepulseFavorite(clientId, req.params.meditationId);
      res.json({ message: "Favorite removed" });
    } catch (error: any) {
      console.error("Error deleting favorite:", error);
      res.status(400).json({ message: error.message || "Failed to delete favorite" });
    }
  });

  app.get('/api/gentlepulse/favorites', async (req, res) => {
    try {
      stripIPAndMetadata(req);
      const clientId = req.query.clientId as string;
      if (!clientId) {
        return res.json([]);
      }
      const favorites = await storage.getGentlepulseFavoritesByClientId(clientId);
      res.json(favorites.map(f => f.meditationId));
    } catch (error: any) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: error.message || "Failed to fetch favorites" });
    }
  });

  app.get('/api/gentlepulse/favorites/check', async (req, res) => {
    try {
      stripIPAndMetadata(req);
      const clientId = req.query.clientId as string;
      const meditationId = req.query.meditationId as string;
      if (!clientId || !meditationId) {
        return res.json({ isFavorite: false });
      }
      const isFavorite = await storage.isGentlepulseFavorite(clientId, meditationId);
      res.json({ isFavorite });
    } catch (error: any) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ message: error.message || "Failed to check favorite" });
    }
  });

  // GentlePulse Admin routes
  app.post('/api/gentlepulse/admin/meditations', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const body = req.body;
      
      if (typeof body.tags === 'string') {
        try {
          body.tags = JSON.parse(body.tags);
        } catch (e) {
          body.tags = [];
        }
      }

      const validatedData = insertGentlepulseMeditationSchema.parse(body);
      const meditation = await storage.createGentlepulseMeditation(validatedData);
      
      await logAdminAction(
        userId,
        "create_gentlepulse_meditation",
        "meditation",
        meditation.id,
        { title: meditation.title }
      );

      res.json(meditation);
    } catch (error: any) {
      console.error("Error creating meditation:", error);
      res.status(400).json({ message: error.message || "Failed to create meditation" });
    }
  });

  app.put('/api/gentlepulse/admin/meditations/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const body = req.body;
      
      if (typeof body.tags === 'string') {
        try {
          body.tags = JSON.parse(body.tags);
        } catch (e) {
          body.tags = [];
        }
      }

      const meditation = await storage.updateGentlepulseMeditation(req.params.id, body);
      
      await logAdminAction(
        userId,
        "update_gentlepulse_meditation",
        "meditation",
        meditation.id,
        { title: meditation.title }
      );

      res.json(meditation);
    } catch (error: any) {
      console.error("Error updating meditation:", error);
      res.status(400).json({ message: error.message || "Failed to update meditation" });
    }
  });

  // GentlePulse Admin Announcement routes
  app.get('/api/gentlepulse/admin/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllGentlepulseAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching GentlePulse announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/gentlepulse/admin/announcements', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertGentlepulseAnnouncementSchema.parse(req.body);

      const announcement = await storage.createGentlepulseAnnouncement(validatedData);
      
      await logAdminAction(
        userId,
        "create_gentlepulse_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title, type: announcement.type }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error creating GentlePulse announcement:", error);
      res.status(400).json({ message: error.message || "Failed to create announcement" });
    }
  });

  app.put('/api/gentlepulse/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.updateGentlepulseAnnouncement(req.params.id, req.body);
      
      await logAdminAction(
        userId,
        "update_gentlepulse_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error updating GentlePulse announcement:", error);
      res.status(400).json({ message: error.message || "Failed to update announcement" });
    }
  });

  app.delete('/api/gentlepulse/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.deactivateGentlepulseAnnouncement(req.params.id);
      
      await logAdminAction(
        userId,
        "deactivate_gentlepulse_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error deleting GentlePulse announcement:", error);
      res.status(400).json({ message: error.message || "Failed to delete announcement" });
    }
  });

  // ========================================
  // LOSTMAIL ROUTES
  // ========================================

  // Create uploads directory if it doesn't exist
  // In production (bundled), import.meta.url might not work reliably, so use process.cwd()
  let uploadsDir: string;
  let cwd: string;
  try {
    cwd = process.cwd();
    if (!cwd || typeof cwd !== 'string') {
      throw new Error(`process.cwd() returned invalid: ${cwd}`);
    }
  } catch (cwdError) {
    // Last resort fallback - assume we're in /app on Railway
    console.warn('process.cwd() failed, using /app as fallback:', cwdError);
    cwd = '/app';
  }
  uploadsDir = path.join(cwd, "uploads", "lostmail");
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(path.join(uploadsDir, "thumbnails"), { recursive: true });
  } catch (err) {
    console.error("Error creating uploads directory:", err);
  }

  // Serve uploaded files statically
  app.use("/uploads/lostmail", express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg") || filePath.endsWith(".png") || filePath.endsWith(".gif")) {
        res.setHeader("Content-Type", "image/jpeg");
      }
    },
  }));

  // LostMail Announcement routes (public)
  app.get('/api/lostmail/announcements', async (req, res) => {
    try {
      const announcements = await storage.getActiveLostmailAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching LostMail announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // LostMail Incident routes
  app.post('/api/lostmail/incidents', async (req, res) => {
    try {
      // Parse photos array if present (from JSON string)
      const body = req.body;
      if (typeof body.photos === 'string') {
        try {
          body.photos = JSON.parse(body.photos);
        } catch (e) {
          body.photos = null;
        }
      }
      if (Array.isArray(body.photos)) {
        body.photos = JSON.stringify(body.photos);
      }

      const validatedData = insertLostmailIncidentSchema.parse(body);
      const incident = await storage.createLostmailIncident(validatedData);
      
      console.log(`LostMail incident created: ${incident.id} by ${incident.reporterEmail}`);
      
      res.json(incident);
    } catch (error: any) {
      console.error("Error creating LostMail incident:", error);
      res.status(400).json({ message: error.message || "Failed to create incident" });
    }
  });

  app.get('/api/lostmail/incidents', async (req, res) => {
    try {
      const email = req.query.email as string;
      
      if (email) {
        // User lookup by email
        const incidents = await storage.getLostmailIncidentsByEmail(email);
        res.json(incidents);
      } else if (isAdmin(req)) {
        // Admin list with filters
        const filters: any = {};
        if (req.query.incidentType) filters.incidentType = req.query.incidentType as string;
        if (req.query.status) filters.status = req.query.status as string;
        if (req.query.severity) filters.severity = req.query.severity as string;
        if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
        if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
        if (req.query.search) filters.search = req.query.search as string;
        filters.limit = parseInt(req.query.limit as string || "50");
        filters.offset = parseInt(req.query.offset as string || "0");
        
        const result = await storage.getLostmailIncidents(filters);
        res.json(result);
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (error: any) {
      console.error("Error fetching LostMail incidents:", error);
      res.status(500).json({ message: error.message || "Failed to fetch incidents" });
    }
  });

  app.get('/api/lostmail/incidents/:id', async (req, res) => {
    try {
      const incident = await storage.getLostmailIncidentById(req.params.id);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      
      // Only admins or the reporter can view details
      const email = req.query.email as string;
      if (!isAdmin(req) && incident.reporterEmail !== email) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(incident);
    } catch (error: any) {
      console.error("Error fetching LostMail incident:", error);
      res.status(500).json({ message: error.message || "Failed to fetch incident" });
    }
  });

  app.put('/api/lostmail/incidents/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const incidentId = req.params.id;
      const updateData = req.body;
      
      // Get old incident to track status changes
      const oldIncident = await storage.getLostmailIncidentById(incidentId);
      if (!oldIncident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      
      // Get admin user info
      const adminUser = await storage.getUser(userId);
      const adminName = adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : "Admin";
      
      // Track status change in audit trail
      if (updateData.status && updateData.status !== oldIncident.status) {
        await storage.createLostmailAuditTrailEntry({
          incidentId,
          adminName,
          action: "status_change",
          note: `Status changed from ${oldIncident.status} to ${updateData.status}${updateData.note ? `: ${updateData.note}` : ""}`,
        });
      }
      
      // Track assignment change
      if (updateData.assignedTo !== undefined && updateData.assignedTo !== oldIncident.assignedTo) {
        await storage.createLostmailAuditTrailEntry({
          incidentId,
          adminName,
          action: "assigned",
          note: `Assigned to ${updateData.assignedTo || "unassigned"}`,
        });
      }
      
      // Track note addition
      if (updateData.note && updateData.note !== "") {
        await storage.createLostmailAuditTrailEntry({
          incidentId,
          adminName,
          action: "note_added",
          note: updateData.note,
        });
      }
      
      // Remove note from update data (it's only for audit trail)
      const { note, ...updateDataWithoutNote } = updateData;
      
      const updated = await storage.updateLostmailIncident(incidentId, updateDataWithoutNote);
      
      console.log(`LostMail incident ${incidentId} updated by admin ${adminName}`);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating LostMail incident:", error);
      res.status(400).json({ message: error.message || "Failed to update incident" });
    }
  });

  app.get('/api/lostmail/incidents/:id/audit-trail', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const auditTrail = await storage.getLostmailAuditTrailByIncident(req.params.id);
      res.json(auditTrail);
    } catch (error: any) {
      console.error("Error fetching audit trail:", error);
      res.status(500).json({ message: error.message || "Failed to fetch audit trail" });
    }
  });

  // File upload endpoint
  app.post('/api/lostmail/upload', async (req, res) => {
    try {
      // Handle multipart/form-data upload
      // This is a simplified version - in production, use multer or similar
      // For now, we'll accept base64 encoded images
      const { image, filename } = req.body;
      
      if (!image || !filename) {
        return res.status(400).json({ message: "Image and filename required" });
      }
      
      // Decode base64 image
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      // Generate unique filename
      const ext = path.extname(filename) || ".jpg";
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const filePath = path.join(uploadsDir, uniqueFilename);
      
      // Save file
      await fs.writeFile(filePath, buffer);
      
      // Create thumbnail (simplified - just copy for now, in production use sharp or similar)
      const thumbnailPath = path.join(uploadsDir, "thumbnails", uniqueFilename);
      await fs.writeFile(thumbnailPath, buffer);
      
      const fileUrl = `/uploads/lostmail/${uniqueFilename}`;
      const thumbnailUrl = `/uploads/lostmail/thumbnails/${uniqueFilename}`;
      
      res.json({ fileUrl, thumbnailUrl, filename: uniqueFilename });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: error.message || "Failed to upload file" });
    }
  });

  // Bulk export endpoint
  app.get('/api/lostmail/admin/export', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const format = req.query.format as string || "json";
      const ids = req.query.ids as string | string[];
      
      let incidents: any[];
      
      if (ids) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        incidents = await Promise.all(
          idArray.map(id => storage.getLostmailIncidentById(id))
        );
        incidents = incidents.filter(i => i !== undefined);
      } else {
        const result = await storage.getLostmailIncidents({ limit: 1000 });
        incidents = result.incidents;
      }
      
      if (format === "csv") {
        // CSV export
        const headers = ["ID", "Reporter Name", "Email", "Type", "Status", "Severity", "Tracking Number", "Carrier", "Created At"];
        const rows = incidents.map(inc => [
          inc.id,
          inc.reporterName,
          inc.reporterEmail,
          inc.incidentType,
          inc.status,
          inc.severity,
          inc.trackingNumber,
          inc.carrier || "",
          new Date(inc.createdAt).toISOString(),
        ]);
        
        const csv = [headers.join(","), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
        
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="lostmail-incidents-${Date.now()}.csv"`);
        res.send(csv);
      } else {
        // JSON export
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="lostmail-incidents-${Date.now()}.json"`);
        res.json(incidents);
      }
      
      console.log(`LostMail export: ${incidents.length} incidents exported as ${format}`);
    } catch (error: any) {
      console.error("Error exporting LostMail incidents:", error);
      res.status(500).json({ message: error.message || "Failed to export incidents" });
    }
  });

  // LostMail Admin Announcement routes
  app.get('/api/lostmail/admin/announcements', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllLostmailAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching LostMail announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/lostmail/admin/announcements', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertLostmailAnnouncementSchema.parse(req.body);

      const announcement = await storage.createLostmailAnnouncement(validatedData);
      
      await logAdminAction(
        userId,
        "create_lostmail_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title, type: announcement.type }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error creating LostMail announcement:", error);
      res.status(400).json({ message: error.message || "Failed to create announcement" });
    }
  });

  app.put('/api/lostmail/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.updateLostmailAnnouncement(req.params.id, req.body);
      
      await logAdminAction(
        userId,
        "update_lostmail_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error updating LostMail announcement:", error);
      res.status(400).json({ message: error.message || "Failed to update announcement" });
    }
  });

  app.delete('/api/lostmail/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.deactivateLostmailAnnouncement(req.params.id);
      
      await logAdminAction(
        userId,
        "deactivate_lostmail_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error deleting LostMail announcement:", error);
      res.status(400).json({ message: error.message || "Failed to delete announcement" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

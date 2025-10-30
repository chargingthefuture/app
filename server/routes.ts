import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
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
  insertDirectoryProfileSchema,
  insertChatGroupSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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

  app.post('/api/admin/invites', isAuthenticated, isAdmin, async (req: any, res) => {
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

  app.post('/api/admin/payments', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertPaymentSchema.parse({
        ...req.body,
        recordedBy: userId,
      });

      const payment = await storage.createPayment(validatedData);
      
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

  app.post('/api/admin/pricing-tiers', isAuthenticated, isAdmin, async (req: any, res) => {
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

  app.put('/api/admin/pricing-tiers/:id/set-current', isAuthenticated, isAdmin, async (req: any, res) => {
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
      if (profile.displayNameType === 'nickname' && profile.nickname) {
        displayName = profile.nickname;
      } else if (profile.displayNameType === 'first' && profile.userId) {
        const user = await storage.getUser(profile.userId);
        displayName = user?.firstName || null;
      }
      if (!displayName && profile.nickname) displayName = profile.nickname;
      res.json({ ...profile, displayName });
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
      const profile = await storage.getDirectoryProfileByUserId(userId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      await storage.deleteDirectoryProfile(profile.id);
      res.json({ message: "Directory profile deleted" });
    } catch (error) {
      console.error("Error deleting Directory profile:", error);
      res.status(500).json({ message: "Failed to delete profile" });
    }
  });

  // Public routes
  app.get('/api/directory/public/:id', async (req, res) => {
    try {
      const profile = await storage.getDirectoryProfileById(req.params.id);
      if (!profile || !profile.isPublic) {
        return res.status(404).json({ message: "Profile not found" });
      }
      let displayName: string | null = null;
      if (profile.displayNameType === 'nickname' && profile.nickname) {
        displayName = profile.nickname;
      } else if (profile.displayNameType === 'first' && profile.userId) {
        const user = await storage.getUser(profile.userId);
        displayName = user?.firstName || null;
      }
      if (!displayName && profile.nickname) displayName = profile.nickname;
      res.json({ ...profile, displayName });
    } catch (error) {
      console.error("Error fetching public Directory profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get('/api/directory/public', async (req, res) => {
    try {
      const profiles = await storage.listPublicDirectoryProfiles();
      const withNames = await Promise.all(profiles.map(async (p) => {
        let name: string | null = null;
        if (p.displayNameType === 'nickname' && p.nickname) {
          name = p.nickname;
        } else if (p.displayNameType === 'first' && p.userId) {
          const u = await storage.getUser(p.userId);
          name = u?.firstName || null;
        }
        // Fallback to nickname if no name found
        if (!name && p.nickname) name = p.nickname;
        // Ensure we always return displayName (even if null)
        return { ...p, displayName: name || null };
      }));
      res.json(withNames);
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
        if (p.displayNameType === 'nickname' && p.nickname) {
          name = p.nickname;
        } else if (p.displayNameType === 'first' && p.userId) {
          const u = await storage.getUser(p.userId);
          name = u?.firstName || null;
        }
        // Fallback to nickname if no name found
        if (!name && p.nickname) name = p.nickname;
        // Ensure we always return displayName (even if null)
        return { ...p, displayName: name || null };
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

  // Admin toggle verification
  app.put('/api/directory/admin/profiles/:id/verify', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = getUserId(req);
      const { isVerified } = req.body;
      const updated = await storage.updateDirectoryProfile(req.params.id, { isVerified: !!isVerified } as any);
      await logAdminAction(adminId, 'verify_directory_profile', 'directory_profile', updated.id, { isVerified: updated.isVerified });
      res.json(updated);
    } catch (error: any) {
      console.error("Error verifying Directory profile:", error);
      res.status(400).json({ message: error.message || "Failed to verify profile" });
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
  app.get('/api/supportmatch/announcements', async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
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
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/supportmatch/admin/announcements', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertAnnouncementSchema.parse(req.body);

      const announcement = await storage.createAnnouncement(validatedData);
      
      await logAdminAction(
        userId,
        "create_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title, type: announcement.type }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      res.status(400).json({ message: error.message || "Failed to create announcement" });
    }
  });

  app.put('/api/supportmatch/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.updateAnnouncement(req.params.id, req.body);
      
      await logAdminAction(
        userId,
        "update_announcement",
        "announcement",
        announcement.id,
        { title: announcement.title }
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error updating announcement:", error);
      res.status(400).json({ message: error.message || "Failed to update announcement" });
    }
  });

  app.delete('/api/supportmatch/admin/announcements/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const announcement = await storage.deactivateAnnouncement(req.params.id);
      
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
      
      const request = await storage.createSocketrelayRequest(userId, validated.description);
      res.json(request);
    } catch (error: any) {
      console.error("Error creating SocketRelay request:", error);
      res.status(400).json({ message: error.message || "Failed to create request" });
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

  const httpServer = createServer(app);
  return httpServer;
}

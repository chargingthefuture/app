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
  insertLighthouseProfileSchema,
  insertLighthousePropertySchema,
  insertLighthouseMatchSchema,
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

  const httpServer = createServer(app);
  return httpServer;
}

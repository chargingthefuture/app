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

  const httpServer = createServer(app);
  return httpServer;
}

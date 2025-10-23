import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { insertInviteCodeSchema, insertPaymentSchema, insertProductSchema } from "@shared/schema";

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

  app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getActiveProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
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

  // Admin routes - Products
  app.get('/api/admin/products', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/admin/products', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertProductSchema.parse(req.body);

      const product = await storage.createProduct(validatedData);
      
      await logAdminAction(
        userId,
        "create_product",
        "product",
        product.id,
        { name: product.name, type: product.productType }
      );

      res.json(product);
    } catch (error: any) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: error.message || "Failed to create product" });
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

  const httpServer = createServer(app);
  return httpServer;
}

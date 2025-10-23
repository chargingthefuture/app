import {
  users,
  inviteCodes,
  pricingTiers,
  payments,
  products,
  adminActionLogs,
  type User,
  type UpsertUser,
  type InviteCode,
  type InsertInviteCode,
  type PricingTier,
  type InsertPricingTier,
  type Payment,
  type InsertPayment,
  type Product,
  type InsertProduct,
  type AdminActionLog,
  type InsertAdminActionLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Invite code operations
  createInviteCode(inviteCode: InsertInviteCode): Promise<InviteCode>;
  getInviteCodeByCode(code: string): Promise<InviteCode | undefined>;
  getAllInviteCodes(): Promise<InviteCode[]>;
  incrementInviteCodeUsage(code: string): Promise<void>;
  
  // Pricing tier operations
  getCurrentPricingTier(): Promise<PricingTier | undefined>;
  createPricingTier(tier: InsertPricingTier): Promise<PricingTier>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  getAllPayments(): Promise<Payment[]>;
  
  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getAllProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  
  // Admin action log operations
  createAdminActionLog(log: InsertAdminActionLog): Promise<AdminActionLog>;
  getAllAdminActionLogs(): Promise<AdminActionLog[]>;
  
  // Stats
  getAdminStats(): Promise<{
    totalUsers: number;
    activeInvites: number;
    monthlyRevenue: string;
    totalProducts: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Invite code operations
  async createInviteCode(inviteCodeData: InsertInviteCode): Promise<InviteCode> {
    // Generate a unique 12-character code
    const code = randomBytes(6).toString('hex').toUpperCase();
    
    const [inviteCode] = await db
      .insert(inviteCodes)
      .values({
        ...inviteCodeData,
        code,
      })
      .returning();
    return inviteCode;
  }

  async getInviteCodeByCode(code: string): Promise<InviteCode | undefined> {
    const [inviteCode] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code));
    return inviteCode;
  }

  async getAllInviteCodes(): Promise<InviteCode[]> {
    return await db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
  }

  async incrementInviteCodeUsage(code: string): Promise<void> {
    await db
      .update(inviteCodes)
      .set({
        currentUses: sql`${inviteCodes.currentUses} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(inviteCodes.code, code));
  }

  // Pricing tier operations
  async getCurrentPricingTier(): Promise<PricingTier | undefined> {
    const [tier] = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.isCurrentTier, true))
      .orderBy(desc(pricingTiers.effectiveDate))
      .limit(1);
    return tier;
  }

  async createPricingTier(tierData: InsertPricingTier): Promise<PricingTier> {
    // If this is set as the current tier, unset all others
    if (tierData.isCurrentTier) {
      await db
        .update(pricingTiers)
        .set({ isCurrentTier: false })
        .where(eq(pricingTiers.isCurrentTier, true));
    }

    const [tier] = await db
      .insert(pricingTiers)
      .values(tierData)
      .returning();
    return tier;
  }

  // Payment operations
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(paymentData)
      .returning();
    return payment;
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.paymentDate));
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .orderBy(desc(payments.paymentDate));
  }

  // Product operations
  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    return product;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getActiveProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));
  }

  // Admin action log operations
  async createAdminActionLog(logData: InsertAdminActionLog): Promise<AdminActionLog> {
    const [log] = await db
      .insert(adminActionLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getAllAdminActionLogs(): Promise<AdminActionLog[]> {
    return await db
      .select()
      .from(adminActionLogs)
      .orderBy(desc(adminActionLogs.createdAt))
      .limit(100);
  }

  // Stats
  async getAdminStats() {
    const allUsers = await db.select().from(users);
    const allInvites = await db.select().from(inviteCodes).where(eq(inviteCodes.isActive, true));
    const allProducts = await db.select().from(products);
    
    // Calculate monthly revenue based on current active users
    const monthlyRevenue = allUsers.reduce((sum, user) => {
      if (user.subscriptionStatus === 'active') {
        return sum + parseFloat(user.pricingTier);
      }
      return sum;
    }, 0);

    const activeInvites = allInvites.filter(invite => {
      const isNotExpired = !invite.expiresAt || new Date(invite.expiresAt) > new Date();
      const hasUsesRemaining = invite.currentUses < invite.maxUses;
      return isNotExpired && hasUsesRemaining;
    }).length;

    return {
      totalUsers: allUsers.length,
      activeInvites,
      monthlyRevenue: monthlyRevenue.toFixed(2),
      totalProducts: allProducts.length,
    };
  }
}

export const storage = new DatabaseStorage();

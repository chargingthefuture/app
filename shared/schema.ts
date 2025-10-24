import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth with additional fields
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  pricingTier: decimal("pricing_tier", { precision: 10, scale: 2 }).notNull().default('1.00'),
  subscriptionStatus: varchar("subscription_status", { length: 20 }).notNull().default('active'), // active, overdue, inactive
  inviteCodeUsed: varchar("invite_code_used", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  paymentsReceived: many(payments),
  paymentsRecorded: many(payments, { relationName: "recordedBy" }),
  inviteCodesCreated: many(inviteCodes),
  adminActions: many(adminActionLogs),
}));

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Invite codes table
export const inviteCodes = pgTable("invite_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  maxUses: integer("max_uses").notNull(),
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inviteCodesRelations = relations(inviteCodes, ({ one }) => ({
  creator: one(users, {
    fields: [inviteCodes.createdBy],
    references: [users.id],
  }),
}));

export const insertInviteCodeSchema = createInsertSchema(inviteCodes).omit({
  id: true,
  code: true,
  currentUses: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInviteCode = z.infer<typeof insertInviteCodeSchema>;
export type InviteCode = typeof inviteCodes.$inferSelect;

// Pricing tiers table - tracks historical pricing levels
export const pricingTiers = pgTable("pricing_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  effectiveDate: timestamp("effective_date").notNull().defaultNow(),
  isCurrentTier: boolean("is_current_tier").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPricingTierSchema = createInsertSchema(pricingTiers).omit({
  id: true,
  createdAt: true,
});

export type InsertPricingTier = z.infer<typeof insertPricingTierSchema>;
export type PricingTier = typeof pricingTiers.$inferSelect;

// Payments table - manual payment tracking
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull().default('cash'),
  notes: text("notes"),
  recordedBy: varchar("recorded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  recorder: one(users, {
    fields: [payments.recordedBy],
    references: [users.id],
    relationName: "recordedBy",
  }),
}));

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Admin action logs table
export const adminActionLogs = pgTable("admin_action_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(), // user, invite_code, payment
  targetId: varchar("target_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminActionLogsRelations = relations(adminActionLogs, ({ one }) => ({
  admin: one(users, {
    fields: [adminActionLogs.adminId],
    references: [users.id],
  }),
}));

export const insertAdminActionLogSchema = createInsertSchema(adminActionLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminActionLog = z.infer<typeof insertAdminActionLogSchema>;
export type AdminActionLog = typeof adminActionLogs.$inferSelect;

// ========================================
// SUPPORTMATCH APP TABLES
// ========================================

// SupportMatch user profiles - extends base user with SupportMatch-specific data
export const supportMatchProfiles = pgTable("support_match_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  nickname: varchar("nickname", { length: 100 }),
  gender: varchar("gender", { length: 50 }), // male, female, prefer-not-to-say
  genderPreference: varchar("gender_preference", { length: 50 }), // male, female, prefer-not-to-say, any
  timezone: varchar("timezone", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const supportMatchProfilesRelations = relations(supportMatchProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [supportMatchProfiles.userId],
    references: [users.id],
  }),
  partnershipsAsUser1: many(partnerships, { relationName: "user1Partnerships" }),
  partnershipsAsUser2: many(partnerships, { relationName: "user2Partnerships" }),
  messagesSent: many(messages),
  exclusionsCreated: many(exclusions, { relationName: "excluderUser" }),
  exclusionsReceived: many(exclusions, { relationName: "excludedUser" }),
  reportsCreated: many(reports, { relationName: "reporter" }),
  reportsReceived: many(reports, { relationName: "reported" }),
}));

export const insertSupportMatchProfileSchema = createInsertSchema(supportMatchProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSupportMatchProfile = z.infer<typeof insertSupportMatchProfileSchema>;
export type SupportMatchProfile = typeof supportMatchProfiles.$inferSelect;

// Partnerships - accountability partner pairings
export const partnerships = pgTable("partnerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => supportMatchProfiles.userId),
  user2Id: varchar("user2_id").notNull().references(() => supportMatchProfiles.userId),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 20 }).notNull().default('active'), // active, completed, ended_early, cancelled
  successRate: jsonb("success_rate"), // JSON for flexible tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const partnershipsRelations = relations(partnerships, ({ one, many }) => ({
  user1Profile: one(supportMatchProfiles, {
    fields: [partnerships.user1Id],
    references: [supportMatchProfiles.userId],
    relationName: "user1Partnerships",
  }),
  user2Profile: one(supportMatchProfiles, {
    fields: [partnerships.user2Id],
    references: [supportMatchProfiles.userId],
    relationName: "user2Partnerships",
  }),
  messages: many(messages),
  reports: many(reports),
}));

export const insertPartnershipSchema = createInsertSchema(partnerships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPartnership = z.infer<typeof insertPartnershipSchema>;
export type Partnership = typeof partnerships.$inferSelect;

// Messages - partnership communication
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnershipId: varchar("partnership_id").notNull().references(() => partnerships.id),
  senderId: varchar("sender_id").notNull().references(() => supportMatchProfiles.userId),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  partnership: one(partnerships, {
    fields: [messages.partnershipId],
    references: [partnerships.id],
  }),
  sender: one(supportMatchProfiles, {
    fields: [messages.senderId],
    references: [supportMatchProfiles.userId],
  }),
}));

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Exclusions - user blocking system
export const exclusions = pgTable("exclusions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => supportMatchProfiles.userId),
  excludedUserId: varchar("excluded_user_id").notNull().references(() => supportMatchProfiles.userId),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exclusionsRelations = relations(exclusions, ({ one }) => ({
  excluder: one(supportMatchProfiles, {
    fields: [exclusions.userId],
    references: [supportMatchProfiles.userId],
    relationName: "excluderUser",
  }),
  excluded: one(supportMatchProfiles, {
    fields: [exclusions.excludedUserId],
    references: [supportMatchProfiles.userId],
    relationName: "excludedUser",
  }),
}));

export const insertExclusionSchema = createInsertSchema(exclusions).omit({
  id: true,
  createdAt: true,
});

export type InsertExclusion = z.infer<typeof insertExclusionSchema>;
export type Exclusion = typeof exclusions.$inferSelect;

// Reports - safety and moderation system
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => supportMatchProfiles.userId),
  reportedUserId: varchar("reported_user_id").notNull().references(() => supportMatchProfiles.userId),
  partnershipId: varchar("partnership_id").references(() => partnerships.id),
  reason: varchar("reason", { length: 100 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, investigating, resolved, dismissed
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(supportMatchProfiles, {
    fields: [reports.reporterId],
    references: [supportMatchProfiles.userId],
    relationName: "reporter",
  }),
  reportedUser: one(supportMatchProfiles, {
    fields: [reports.reportedUserId],
    references: [supportMatchProfiles.userId],
    relationName: "reported",
  }),
  partnership: one(partnerships, {
    fields: [reports.partnershipId],
    references: [partnerships.id],
  }),
}));

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// Announcements - platform communications
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull().default('info'), // info, warning, maintenance, update, promotion
  isActive: boolean("is_active").notNull().default(true),
  showOnLogin: boolean("show_on_login").notNull().default(false),
  showOnSignInPage: boolean("show_on_sign_in_page").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

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
  isVerified: boolean("is_verified").default(false).notNull(),
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
}).extend({
  expiresAt: z.coerce.date().optional(),
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
}).extend({
  effectiveDate: z.coerce.date().optional(),
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
  billingPeriod: varchar("billing_period", { length: 20 }).notNull().default('monthly'), // monthly, yearly
  billingMonth: varchar("billing_month", { length: 7 }), // YYYY-MM format for calendar month
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
  paymentDate: true,
}).extend({
  paymentDate: z.preprocess(
    (val) => {
      if (val instanceof Date) return val;
      if (typeof val === "string") return new Date(val);
      return val;
    },
    z.date()
  ),
  billingPeriod: z.enum(["monthly", "yearly"]).default("monthly"),
  billingMonth: z.preprocess(
    (val) => {
      // Normalize: convert undefined/empty to null
      if (val === undefined || val === "" || val === null) {
        return null;
      }
      // If it's a string, validate format
      if (typeof val === "string" && /^\d{4}-\d{2}$/.test(val)) {
        return val;
      }
      // If it doesn't match, still return it (validation will catch it)
      return val;
    },
    z.union([
      z.string().regex(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format"),
      z.null(),
    ]).optional()
  ),
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
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  timezone: varchar("timezone", { length: 100 }),
  timezonePreference: varchar("timezone_preference", { length: 50 }).notNull().default('same_timezone'), // same_timezone, any_timezone
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

// Announcements - platform communications (platform-wide announcements)
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
}).extend({
  expiresAt: z.coerce.date().optional().nullable(),
});

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

// SupportMatch Announcements
export const supportmatchAnnouncements = pgTable("supportmatch_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull().default('info'), // info, warning, maintenance, update, promotion
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupportmatchAnnouncementSchema = createInsertSchema(supportmatchAnnouncements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  expiresAt: z.coerce.date().optional().nullable(),
});

export type InsertSupportmatchAnnouncement = z.infer<typeof insertSupportmatchAnnouncementSchema>;
export type SupportmatchAnnouncement = typeof supportmatchAnnouncements.$inferSelect;

// ========================================
// SLEEPSTORIES APP TABLES
// ========================================

// Sleep Stories - calming audio content for relaxation and sleep
export const sleepStories = pgTable("sleep_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // Duration in seconds
  wistiaMediaId: varchar("wistia_media_id", { length: 100 }).notNull(), // Wistia embed ID
  downloadUrl: text("download_url"), // Optional direct download URL
  category: varchar("category", { length: 50 }).notNull().default('general'), // e.g., nature, fantasy, meditation
  thumbnailUrl: text("thumbnail_url"), // Optional image URL
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSleepStorySchema = createInsertSchema(sleepStories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSleepStory = z.infer<typeof insertSleepStorySchema>;
export type SleepStory = typeof sleepStories.$inferSelect;

// SleepStories Announcements
export const sleepStoriesAnnouncements = pgTable("sleep_stories_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull().default('info'), // info, warning, maintenance, update, promotion
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSleepStoriesAnnouncementSchema = createInsertSchema(sleepStoriesAnnouncements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  expiresAt: z.coerce.date().optional().nullable(),
});

export type InsertSleepStoriesAnnouncement = z.infer<typeof insertSleepStoriesAnnouncementSchema>;
export type SleepStoriesAnnouncement = typeof sleepStoriesAnnouncements.$inferSelect;

// ========================================
// LIGHTHOUSE APP TABLES
// ========================================

// LightHouse user profiles (seekers and hosts)
export const lighthouseProfiles = pgTable("lighthouse_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  profileType: varchar("profile_type", { length: 20 }).notNull(), // 'seeker' or 'host'
  displayName: varchar("display_name", { length: 100 }).notNull(),
  bio: text("bio"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  signalUrl: text("signal_url"),
  
  // For seekers
  housingNeeds: text("housing_needs"), // Description of what they need
  moveInDate: timestamp("move_in_date"),
  budgetMin: decimal("budget_min", { precision: 10, scale: 2 }),
  budgetMax: decimal("budget_max", { precision: 10, scale: 2 }),
  
  // For hosts
  hasProperty: boolean("has_property").default(false),
  
  // Common fields
  isVerified: boolean("is_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lighthouseProfilesRelations = relations(lighthouseProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [lighthouseProfiles.userId],
    references: [users.id],
  }),
  properties: many(lighthouseProperties),
  matchesAsSeeker: many(lighthouseMatches, { relationName: "seeker" }),
}));

export const insertLighthouseProfileSchema = createInsertSchema(lighthouseProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  moveInDate: z.coerce.date().optional().nullable(),
  signalUrl: z.string().optional().nullable().refine(
    (val) => !val || val === "" || z.string().url().safeParse(val).success,
    { message: "Must be a valid URL" }
  ).transform(val => val === "" ? null : val),
});
export type InsertLighthouseProfile = z.infer<typeof insertLighthouseProfileSchema>;
export type LighthouseProfile = typeof lighthouseProfiles.$inferSelect;

// LightHouse property listings
export const lighthouseProperties = pgTable("lighthouse_properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: varchar("host_id").notNull().references(() => lighthouseProfiles.id),
  
  propertyType: varchar("property_type", { length: 50 }).notNull(), // 'room', 'apartment', 'house', 'community'
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  
  // Location
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 10 }).notNull(),
  
  // Details
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  amenities: text("amenities").array(), // Array of amenities like ['WiFi', 'Kitchen Access', 'Parking']
  houseRules: text("house_rules"),
  
  // Pricing
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }),
  
  // Availability
  availableFrom: timestamp("available_from"),
  availableUntil: timestamp("available_until"),
  maxOccupants: integer("max_occupants").default(1),
  
  // Media
  photos: text("photos").array(), // Array of photo URLs
  
  // External links
  airbnbProfileUrl: text("airbnb_profile_url"), // Airbnb host profile URL
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lighthousePropertiesRelations = relations(lighthouseProperties, ({ one, many }) => ({
  host: one(lighthouseProfiles, {
    fields: [lighthouseProperties.hostId],
    references: [lighthouseProfiles.id],
  }),
  matches: many(lighthouseMatches),
}));

export const insertLighthousePropertySchema = createInsertSchema(lighthouseProperties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  availableFrom: z.coerce.date().optional().nullable(),
  availableUntil: z.coerce.date().optional().nullable(),
});
export type InsertLighthouseProperty = z.infer<typeof insertLighthousePropertySchema>;
export type LighthouseProperty = typeof lighthouseProperties.$inferSelect;

// LightHouse matches (connections between seekers and properties)
export const lighthouseMatches = pgTable("lighthouse_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seekerId: varchar("seeker_id").notNull().references(() => lighthouseProfiles.id),
  propertyId: varchar("property_id").notNull().references(() => lighthouseProperties.id),
  
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'accepted', 'rejected', 'completed', 'cancelled'
  
  // Move dates
  proposedMoveInDate: timestamp("proposed_move_in_date"),
  actualMoveInDate: timestamp("actual_move_in_date"),
  proposedMoveOutDate: timestamp("proposed_move_out_date"),
  actualMoveOutDate: timestamp("actual_move_out_date"),
  
  // Messages/notes
  seekerMessage: text("seeker_message"), // Initial message from seeker
  hostResponse: text("host_response"), // Response from host
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lighthouseMatchesRelations = relations(lighthouseMatches, ({ one }) => ({
  seeker: one(lighthouseProfiles, {
    fields: [lighthouseMatches.seekerId],
    references: [lighthouseProfiles.id],
    relationName: "seeker",
  }),
  property: one(lighthouseProperties, {
    fields: [lighthouseMatches.propertyId],
    references: [lighthouseProperties.id],
  }),
}));

export const insertLighthouseMatchSchema = createInsertSchema(lighthouseMatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  proposedMoveInDate: z.coerce.date().optional().nullable(),
  actualMoveInDate: z.coerce.date().optional().nullable(),
  proposedMoveOutDate: z.coerce.date().optional().nullable(),
  actualMoveOutDate: z.coerce.date().optional().nullable(),
});
export type InsertLighthouseMatch = z.infer<typeof insertLighthouseMatchSchema>;
export type LighthouseMatch = typeof lighthouseMatches.$inferSelect;

// LightHouse Announcements
export const lighthouseAnnouncements = pgTable("lighthouse_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull().default('info'), // info, warning, maintenance, update, promotion
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLighthouseAnnouncementSchema = createInsertSchema(lighthouseAnnouncements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  expiresAt: z.coerce.date().optional().nullable(),
});

export type InsertLighthouseAnnouncement = z.infer<typeof insertLighthouseAnnouncementSchema>;
export type LighthouseAnnouncement = typeof lighthouseAnnouncements.$inferSelect;

// SocketRelay Requests - Users post requests for items they need
export const socketrelayRequests = pgTable("socketrelay_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  description: varchar("description", { length: 140 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('active'), // active, fulfilled, closed
  isPublic: boolean("is_public").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const socketrelayRequestsRelations = relations(socketrelayRequests, ({ one, many }) => ({
  creator: one(users, {
    fields: [socketrelayRequests.userId],
    references: [users.id],
  }),
  fulfillments: many(socketrelayFulfillments),
}));

export const insertSocketrelayRequestSchema = createInsertSchema(socketrelayRequests).omit({
  id: true,
  userId: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  description: z.string().min(1, "Description is required").max(140, "Request description must be 140 characters or less"),
  isPublic: z.boolean().optional().default(false),
});

export type InsertSocketrelayRequest = z.infer<typeof insertSocketrelayRequestSchema>;
export type SocketrelayRequest = typeof socketrelayRequests.$inferSelect;

// SocketRelay Fulfillments - When someone clicks "Fulfill" on a request
export const socketrelayFulfillments = pgTable("socketrelay_fulfillments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => socketrelayRequests.id),
  fulfillerUserId: varchar("fulfiller_user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default('active'), // active, completed_success, completed_failure, cancelled
  closedBy: varchar("closed_by").references(() => users.id),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const socketrelayFulfillmentsRelations = relations(socketrelayFulfillments, ({ one, many }) => ({
  request: one(socketrelayRequests, {
    fields: [socketrelayFulfillments.requestId],
    references: [socketrelayRequests.id],
  }),
  fulfiller: one(users, {
    fields: [socketrelayFulfillments.fulfillerUserId],
    references: [users.id],
  }),
  closer: one(users, {
    fields: [socketrelayFulfillments.closedBy],
    references: [users.id],
  }),
  messages: many(socketrelayMessages),
}));

export const insertSocketrelayFulfillmentSchema = createInsertSchema(socketrelayFulfillments).omit({
  id: true,
  status: true,
  closedBy: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSocketrelayFulfillment = z.infer<typeof insertSocketrelayFulfillmentSchema>;
export type SocketrelayFulfillment = typeof socketrelayFulfillments.$inferSelect;

// SocketRelay Messages - Chat messages between requester and fulfiller
export const socketrelayMessages = pgTable("socketrelay_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fulfillmentId: varchar("fulfillment_id").notNull().references(() => socketrelayFulfillments.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socketrelayMessagesRelations = relations(socketrelayMessages, ({ one }) => ({
  fulfillment: one(socketrelayFulfillments, {
    fields: [socketrelayMessages.fulfillmentId],
    references: [socketrelayFulfillments.id],
  }),
  sender: one(users, {
    fields: [socketrelayMessages.senderId],
    references: [users.id],
  }),
}));

export const insertSocketrelayMessageSchema = createInsertSchema(socketrelayMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertSocketrelayMessage = z.infer<typeof insertSocketrelayMessageSchema>;
export type SocketrelayMessage = typeof socketrelayMessages.$inferSelect;

// SocketRelay Profiles - User profiles for SocketRelay app
export const socketrelayProfiles = pgTable("socketrelay_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const socketrelayProfilesRelations = relations(socketrelayProfiles, ({ one }) => ({
  user: one(users, {
    fields: [socketrelayProfiles.userId],
    references: [users.id],
  }),
}));

export const insertSocketrelayProfileSchema = createInsertSchema(socketrelayProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  displayName: z.string().min(1, "Display name is required").max(100, "Display name must be 100 characters or less"),
  city: z.string().min(1, "City is required").max(100, "City must be 100 characters or less"),
  state: z.string().min(1, "State is required").max(100, "State must be 100 characters or less"),
  country: z.string().min(1, "Country is required").max(100, "Country must be 100 characters or less"),
});

export type InsertSocketrelayProfile = z.infer<typeof insertSocketrelayProfileSchema>;
export type SocketrelayProfile = typeof socketrelayProfiles.$inferSelect;

// SocketRelay Announcements
export const socketrelayAnnouncements = pgTable("socketrelay_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull().default('info'), // info, warning, maintenance, update, promotion
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSocketrelayAnnouncementSchema = createInsertSchema(socketrelayAnnouncements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  expiresAt: z.coerce.date().optional().nullable(),
});

export type InsertSocketrelayAnnouncement = z.infer<typeof insertSocketrelayAnnouncementSchema>;
export type SocketrelayAnnouncement = typeof socketrelayAnnouncements.$inferSelect;

// ========================================
// DIRECTORY APP TABLES
// ========================================

// Directory profiles - public skill-sharing directory
export const directoryProfiles = pgTable("directory_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Optional while unclaimed; admin can create unclaimed entries
  userId: varchar("user_id").references(() => users.id).unique(),

  description: varchar("description", { length: 140 }).notNull(),
  // Up to three skills; stored as text array
  skills: text("skills").array().notNull().default(sql`ARRAY[]::text[]`),

  signalUrl: text("signal_url"),
  quoraUrl: text("quora_url"),

  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),

  // Display naming for listings
  nickname: varchar("nickname", { length: 100 }),
  firstName: varchar("first_name", { length: 100 }), // For unclaimed profiles when displayNameType is 'first'
  displayNameType: varchar("display_name_type", { length: 20 }).notNull().default('first'), // 'first' | 'nickname'

  // Verification and visibility
  isVerified: boolean("is_verified").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(false),
  isClaimed: boolean("is_claimed").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const directoryProfilesRelations = relations(directoryProfiles, ({ one }) => ({
  user: one(users, {
    fields: [directoryProfiles.userId],
    references: [users.id],
  }),
}));

export const insertDirectoryProfileSchema = createInsertSchema(directoryProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isClaimed: true,
}).extend({
  // Make description optional (empty allowed) but still capped at 140
  description: z.string().max(140, "Description must be 140 characters or less").optional().nullable(),
  // Require at least one skill, up to 3
  skills: z.array(z.string()).min(1, "Select at least 1 skill").max(3, "Select up to 3 skills"),
  signalUrl: z.string().url().optional().nullable(),
  quoraUrl: z.string().url().optional().nullable(),
  // Require country selection per shared standard
  country: z.string().min(1, "Country is required").max(100, "Country must be 100 characters or less"),
  nickname: z.string().max(100).optional().nullable(),
  firstName: z.string().max(100).optional().nullable(),
  displayNameType: z.enum(['first','nickname']).optional(),
  // userId remains optional to allow unclaimed creation by admin
});

export type InsertDirectoryProfile = z.infer<typeof insertDirectoryProfileSchema>;
export type DirectoryProfile = typeof directoryProfiles.$inferSelect;

// Directory Announcements
export const directoryAnnouncements = pgTable("directory_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull().default('info'), // info, warning, maintenance, update, promotion
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDirectoryAnnouncementSchema = createInsertSchema(directoryAnnouncements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  expiresAt: z.coerce.date().optional().nullable(),
});

export type InsertDirectoryAnnouncement = z.infer<typeof insertDirectoryAnnouncementSchema>;
export type DirectoryAnnouncement = typeof directoryAnnouncements.$inferSelect;

// ========================================
// CHAT GROUPS APP TABLES
// ========================================

export const chatGroups = pgTable("chat_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  signalUrl: text("signal_url").notNull(),
  description: text("description").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatGroupsRelations = relations(chatGroups, ({ one }) => ({
  // No relations needed
}));

export const insertChatGroupSchema = createInsertSchema(chatGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or less"),
  signalUrl: z.string().url("Must be a valid URL"),
  description: z.string().min(1, "Description is required"),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type InsertChatGroup = z.infer<typeof insertChatGroupSchema>;
export type ChatGroup = typeof chatGroups.$inferSelect;

// ChatGroups Announcements
export const chatgroupsAnnouncements = pgTable("chatgroups_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull().default('info'), // info, warning, maintenance, update, promotion
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChatgroupsAnnouncementSchema = createInsertSchema(chatgroupsAnnouncements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  expiresAt: z.coerce.date().optional().nullable(),
});

export type InsertChatgroupsAnnouncement = z.infer<typeof insertChatgroupsAnnouncementSchema>;
export type ChatgroupsAnnouncement = typeof chatgroupsAnnouncements.$inferSelect;

// ========================================
// TRUSTTRANSPORT APP TABLES
// ========================================

// TrustTransport driver profiles
export const trusttransportProfiles = pgTable("trusttransport_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  
  displayName: varchar("display_name", { length: 100 }).notNull(),
  isDriver: boolean("is_driver").notNull().default(false),
  isRider: boolean("is_rider").notNull().default(true),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  
  // Vehicle information
  vehicleMake: varchar("vehicle_make", { length: 100 }),
  vehicleModel: varchar("vehicle_model", { length: 100 }),
  vehicleYear: integer("vehicle_year"),
  vehicleColor: varchar("vehicle_color", { length: 50 }),
  licensePlate: varchar("license_plate", { length: 20 }),
  
  // Driver information
  bio: text("bio"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  signalUrl: text("signal_url"),
  
  // Availability and preferences
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trusttransportProfilesRelations = relations(trusttransportProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [trusttransportProfiles.userId],
    references: [users.id],
  }),
  rideRequests: many(trusttransportRideRequests, { relationName: "rider" }),
  claimedRequests: many(trusttransportRideRequests, { relationName: "driver" }),
}));

export const insertTrusttransportProfileSchema = createInsertSchema(trusttransportProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  displayName: z.string().min(1, "Display name is required").max(100, "Display name must be 100 characters or less"),
  isDriver: z.boolean().default(false),
  isRider: z.boolean().default(true),
  city: z.string().min(1, "City is required").max(100, "City must be 100 characters or less"),
  state: z.string().min(1, "State is required").max(100, "State must be 100 characters or less"),
  country: z.string().min(1, "Country is required").max(100, "Country must be 100 characters or less"),
  vehicleYear: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  phoneNumber: z.string().max(20).optional().nullable(),
  signalUrl: z.string().optional().nullable().refine(
    (val) => !val || val === "" || z.string().url().safeParse(val).success,
    { message: "Must be a valid URL" }
  ).transform(val => val === "" ? null : val),
});

export type InsertTrusttransportProfile = z.infer<typeof insertTrusttransportProfileSchema>;
export type TrusttransportProfile = typeof trusttransportProfiles.$inferSelect;

// TrustTransport ride requests (standalone requests that drivers can claim)
export const trusttransportRideRequests = pgTable("trusttransport_ride_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Rider who created the request
  riderId: varchar("rider_id").notNull().references(() => users.id),
  
  // Driver who claimed the request (null until claimed)
  driverId: varchar("driver_id").references(() => trusttransportProfiles.id),
  
  // Location
  pickupLocation: text("pickup_location").notNull(),
  dropoffLocation: text("dropoff_location").notNull(),
  pickupCity: varchar("pickup_city", { length: 100 }).notNull(),
  pickupState: varchar("pickup_state", { length: 100 }),
  dropoffCity: varchar("dropoff_city", { length: 100 }).notNull(),
  dropoffState: varchar("dropoff_state", { length: 100 }),
  
  // Scheduling
  departureDateTime: timestamp("departure_date_time").notNull(),
  
  // Request criteria
  requestedSeats: integer("requested_seats").notNull().default(1),
  requestedCarType: varchar("requested_car_type", { length: 50 }), // e.g., "sedan", "suv", "van", "truck", null = any
  requiresHeat: boolean("requires_heat").notNull().default(false),
  requiresAC: boolean("requires_ac").notNull().default(false),
  requiresWheelchairAccess: boolean("requires_wheelchair_access").notNull().default(false),
  requiresChildSeat: boolean("requires_child_seat").notNull().default(false),
  
  // Additional preferences/notes
  riderMessage: text("rider_message"), // Notes from rider
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default('open'), // 'open', 'claimed', 'completed', 'cancelled'
  
  // Driver response (when claiming)
  driverMessage: text("driver_message"), // Message from driver when claiming
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trusttransportRideRequestsRelations = relations(trusttransportRideRequests, ({ one }) => ({
  rider: one(users, {
    fields: [trusttransportRideRequests.riderId],
    references: [users.id],
  }),
  driver: one(trusttransportProfiles, {
    fields: [trusttransportRideRequests.driverId],
    references: [trusttransportProfiles.id],
    relationName: "driver",
  }),
}));

export const insertTrusttransportRideRequestSchema = createInsertSchema(trusttransportRideRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  riderId: true, // Added by server from authenticated user
  driverId: true,
  status: true,
  driverMessage: true,
}).extend({
  departureDateTime: z.coerce.date(),
  requestedSeats: z.number().int().min(1, "At least 1 seat is required"),
  requestedCarType: z.enum(["sedan", "suv", "van", "truck"]).optional().nullable(),
  requiresHeat: z.boolean().default(false),
  requiresAC: z.boolean().default(false),
  requiresWheelchairAccess: z.boolean().default(false),
  requiresChildSeat: z.boolean().default(false),
  riderMessage: z.string().optional().nullable(),
});

export type InsertTrusttransportRideRequest = z.infer<typeof insertTrusttransportRideRequestSchema>;
export type TrusttransportRideRequest = typeof trusttransportRideRequests.$inferSelect;

// TrustTransport Announcements
export const trusttransportAnnouncements = pgTable("trusttransport_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull().default('info'), // info, warning, maintenance, update, promotion
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTrusttransportAnnouncementSchema = createInsertSchema(trusttransportAnnouncements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  expiresAt: z.coerce.date().optional().nullable(),
});

export type InsertTrusttransportAnnouncement = z.infer<typeof insertTrusttransportAnnouncementSchema>;
export type TrusttransportAnnouncement = typeof trusttransportAnnouncements.$inferSelect;

// ========================================
// PROFILE DELETION LOG TABLE
// ========================================

// Logs all profile deletions for auditing and analytics
export const profileDeletionLogs = pgTable("profile_deletion_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Original user ID before deletion
  appName: varchar("app_name", { length: 50 }).notNull(), // supportmatch, lighthouse, socketrelay, directory, trusttransport
  deletedAt: timestamp("deleted_at").defaultNow().notNull(),
  reason: text("reason"), // Optional reason provided by user
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profileDeletionLogsRelations = relations(profileDeletionLogs, ({ one }) => ({
  user: one(users, {
    fields: [profileDeletionLogs.userId],
    references: [users.id],
  }),
}));

export const insertProfileDeletionLogSchema = createInsertSchema(profileDeletionLogs).omit({
  id: true,
  deletedAt: true,
  createdAt: true,
});

export type InsertProfileDeletionLog = z.infer<typeof insertProfileDeletionLogSchema>;
export type ProfileDeletionLog = typeof profileDeletionLogs.$inferSelect;

// ========================================
// NPS (NET PROMOTER SCORE) SURVEY
// ========================================

export const npsResponses = pgTable("nps_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  score: integer("score").notNull(), // 0-10 scale
  responseMonth: varchar("response_month", { length: 7 }).notNull(), // YYYY-MM format for tracking monthly
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const npsResponsesRelations = relations(npsResponses, ({ one }) => ({
  user: one(users, {
    fields: [npsResponses.userId],
    references: [users.id],
  }),
}));

export const insertNpsResponseSchema = createInsertSchema(npsResponses).omit({
  id: true,
  createdAt: true,
}).extend({
  score: z.number().int().min(0).max(10),
  responseMonth: z.string().regex(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format"),
});

export type InsertNpsResponse = z.infer<typeof insertNpsResponseSchema>;
export type NpsResponse = typeof npsResponses.$inferSelect;

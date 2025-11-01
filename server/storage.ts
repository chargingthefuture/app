import {
  users,
  inviteCodes,
  pricingTiers,
  payments,
  adminActionLogs,
  supportMatchProfiles,
  partnerships,
  messages,
  exclusions,
  reports,
  announcements,
  supportmatchAnnouncements,
  sleepStories,
  sleepStoriesAnnouncements,
  lighthouseProfiles,
  lighthouseProperties,
  lighthouseMatches,
  lighthouseAnnouncements,
  socketrelayRequests,
  socketrelayFulfillments,
  socketrelayMessages,
  socketrelayProfiles,
  socketrelayAnnouncements,
  directoryProfiles,
  directoryAnnouncements,
  type DirectoryProfile,
  type InsertDirectoryProfile,
  chatGroups,
  chatgroupsAnnouncements,
  type ChatGroup,
  type InsertChatGroup,
  profileDeletionLogs,
  type ProfileDeletionLog,
  type InsertProfileDeletionLog,
  type User,
  type UpsertUser,
  type InviteCode,
  type InsertInviteCode,
  type PricingTier,
  type InsertPricingTier,
  type Payment,
  type InsertPayment,
  type AdminActionLog,
  type InsertAdminActionLog,
  type SupportMatchProfile,
  type InsertSupportMatchProfile,
  type Partnership,
  type InsertPartnership,
  type Message,
  type InsertMessage,
  type Exclusion,
  type InsertExclusion,
  type Report,
  type InsertReport,
  type Announcement,
  type InsertAnnouncement,
  type SupportmatchAnnouncement,
  type InsertSupportmatchAnnouncement,
  type SleepStory,
  type InsertSleepStory,
  type SleepStoriesAnnouncement,
  type InsertSleepStoriesAnnouncement,
  type LighthouseProfile,
  type InsertLighthouseProfile,
  type LighthouseProperty,
  type InsertLighthouseProperty,
  type LighthouseMatch,
  type InsertLighthouseMatch,
  type LighthouseAnnouncement,
  type InsertLighthouseAnnouncement,
  type SocketrelayRequest,
  type InsertSocketrelayRequest,
  type SocketrelayFulfillment,
  type InsertSocketrelayFulfillment,
  type SocketrelayMessage,
  type InsertSocketrelayMessage,
  type SocketrelayProfile,
  type InsertSocketrelayProfile,
  type SocketrelayAnnouncement,
  type InsertSocketrelayAnnouncement,
  type DirectoryAnnouncement,
  type InsertDirectoryAnnouncement,
  type ChatgroupsAnnouncement,
  type InsertChatgroupsAnnouncement,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, or, inArray, gte, lte } from "drizzle-orm";
import { randomBytes } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserVerification(userId: string, isVerified: boolean): Promise<User>;
  
  // Invite code operations
  createInviteCode(inviteCode: InsertInviteCode): Promise<InviteCode>;
  getInviteCodeByCode(code: string): Promise<InviteCode | undefined>;
  getAllInviteCodes(): Promise<InviteCode[]>;
  incrementInviteCodeUsage(code: string): Promise<void>;
  
  // Pricing tier operations
  getCurrentPricingTier(): Promise<PricingTier | undefined>;
  getAllPricingTiers(): Promise<PricingTier[]>;
  createPricingTier(tier: InsertPricingTier): Promise<PricingTier>;
  setCurrentPricingTier(id: string): Promise<PricingTier>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  getAllPayments(): Promise<Payment[]>;
  
  // Admin action log operations
  createAdminActionLog(log: InsertAdminActionLog): Promise<AdminActionLog>;
  getAllAdminActionLogs(): Promise<AdminActionLog[]>;
  
  // Stats
  getAdminStats(): Promise<{
    totalUsers: number;
    activeInvites: number;
    collectedMonthlyRevenue: string;
    outstandingRevenue: string;
  }>;
  
  // SupportMatch Profile operations
  getSupportMatchProfile(userId: string): Promise<SupportMatchProfile | undefined>;
  createSupportMatchProfile(profile: InsertSupportMatchProfile): Promise<SupportMatchProfile>;
  updateSupportMatchProfile(userId: string, profile: Partial<InsertSupportMatchProfile>): Promise<SupportMatchProfile>;
  getAllActiveSupportMatchProfiles(): Promise<SupportMatchProfile[]>;
  getAllSupportMatchProfiles(): Promise<SupportMatchProfile[]>;
  
  // SupportMatch Partnership operations
  createPartnership(partnership: InsertPartnership): Promise<Partnership>;
  getPartnershipById(id: string): Promise<Partnership | undefined>;
  getActivePartnershipByUser(userId: string): Promise<Partnership | undefined>;
  getAllPartnerships(): Promise<Partnership[]>;
  getPartnershipHistory(userId: string): Promise<Partnership[]>;
  updatePartnershipStatus(id: string, status: string): Promise<Partnership>;
  createAlgorithmicMatches(): Promise<Partnership[]>;
  
  // SupportMatch Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByPartnership(partnershipId: string): Promise<Message[]>;
  
  // SupportMatch Exclusion operations
  createExclusion(exclusion: InsertExclusion): Promise<Exclusion>;
  getExclusionsByUser(userId: string): Promise<Exclusion[]>;
  checkMutualExclusion(user1Id: string, user2Id: string): Promise<boolean>;
  deleteExclusion(id: string): Promise<void>;
  
  // SupportMatch Report operations
  createReport(report: InsertReport): Promise<Report>;
  getAllReports(): Promise<Report[]>;
  updateReportStatus(id: string, status: string, resolution?: string): Promise<Report>;
  
  // SupportMatch Announcement operations
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getActiveAnnouncements(): Promise<Announcement[]>;
  getAllAnnouncements(): Promise<Announcement[]>;
  updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement>;
  deactivateAnnouncement(id: string): Promise<Announcement>;
  
  // SupportMatch App Announcement operations
  createSupportmatchAnnouncement(announcement: InsertSupportmatchAnnouncement): Promise<SupportmatchAnnouncement>;
  getActiveSupportmatchAnnouncements(): Promise<SupportmatchAnnouncement[]>;
  getAllSupportmatchAnnouncements(): Promise<SupportmatchAnnouncement[]>;
  updateSupportmatchAnnouncement(id: string, announcement: Partial<InsertSupportmatchAnnouncement>): Promise<SupportmatchAnnouncement>;
  deactivateSupportmatchAnnouncement(id: string): Promise<SupportmatchAnnouncement>;
  
  // SupportMatch Stats
  getSupportMatchStats(): Promise<{
    activeUsers: number;
    currentPartnerships: number;
    pendingReports: number;
  }>;

  // SleepStories operations
  createSleepStory(story: InsertSleepStory): Promise<SleepStory>;
  getAllSleepStories(): Promise<SleepStory[]>;
  getActiveSleepStories(): Promise<SleepStory[]>;
  getSleepStoryById(id: string): Promise<SleepStory | undefined>;
  updateSleepStory(id: string, story: Partial<InsertSleepStory>): Promise<SleepStory>;
  deleteSleepStory(id: string): Promise<void>;

  // SleepStories Announcement operations
  createSleepStoriesAnnouncement(announcement: InsertSleepStoriesAnnouncement): Promise<SleepStoriesAnnouncement>;
  getActiveSleepStoriesAnnouncements(): Promise<SleepStoriesAnnouncement[]>;
  getAllSleepStoriesAnnouncements(): Promise<SleepStoriesAnnouncement[]>;
  updateSleepStoriesAnnouncement(id: string, announcement: Partial<InsertSleepStoriesAnnouncement>): Promise<SleepStoriesAnnouncement>;
  deactivateSleepStoriesAnnouncement(id: string): Promise<SleepStoriesAnnouncement>;

  // LightHouse Profile operations
  createLighthouseProfile(profile: InsertLighthouseProfile): Promise<LighthouseProfile>;
  getLighthouseProfileByUserId(userId: string): Promise<LighthouseProfile | undefined>;
  getLighthouseProfileById(id: string): Promise<LighthouseProfile | undefined>;
  updateLighthouseProfile(id: string, profile: Partial<InsertLighthouseProfile>): Promise<LighthouseProfile>;
  getAllLighthouseProfiles(): Promise<LighthouseProfile[]>;
  getLighthouseProfilesByType(profileType: string): Promise<LighthouseProfile[]>;

  // LightHouse Property operations
  createLighthouseProperty(property: InsertLighthouseProperty): Promise<LighthouseProperty>;
  getLighthousePropertyById(id: string): Promise<LighthouseProperty | undefined>;
  getPropertiesByHost(hostId: string): Promise<LighthouseProperty[]>;
  getAllActiveProperties(): Promise<LighthouseProperty[]>;
  getAllProperties(): Promise<LighthouseProperty[]>;
  updateLighthouseProperty(id: string, property: Partial<InsertLighthouseProperty>): Promise<LighthouseProperty>;
  deleteLighthouseProperty(id: string): Promise<void>;

  // LightHouse Match operations
  createLighthouseMatch(match: InsertLighthouseMatch): Promise<LighthouseMatch>;
  getLighthouseMatchById(id: string): Promise<LighthouseMatch | undefined>;
  getMatchesBySeeker(seekerId: string): Promise<LighthouseMatch[]>;
  getMatchesByProperty(propertyId: string): Promise<LighthouseMatch[]>;
  getAllMatches(): Promise<LighthouseMatch[]>;
  updateLighthouseMatch(id: string, match: Partial<InsertLighthouseMatch>): Promise<LighthouseMatch>;

  // LightHouse Stats
  getLighthouseStats(): Promise<{
    totalSeekers: number;
    totalHosts: number;
    totalProperties: number;
    activeMatches: number;
    completedMatches: number;
  }>;

  // LightHouse Announcement operations
  createLighthouseAnnouncement(announcement: InsertLighthouseAnnouncement): Promise<LighthouseAnnouncement>;
  getActiveLighthouseAnnouncements(): Promise<LighthouseAnnouncement[]>;
  getAllLighthouseAnnouncements(): Promise<LighthouseAnnouncement[]>;
  updateLighthouseAnnouncement(id: string, announcement: Partial<InsertLighthouseAnnouncement>): Promise<LighthouseAnnouncement>;
  deactivateLighthouseAnnouncement(id: string): Promise<LighthouseAnnouncement>;

  // SocketRelay Request operations
  createSocketrelayRequest(userId: string, description: string, isPublic?: boolean): Promise<SocketrelayRequest>;
  getActiveSocketrelayRequests(): Promise<any[]>;
  getAllSocketrelayRequests(): Promise<any[]>;
  getSocketrelayRequestById(id: string): Promise<SocketrelayRequest | undefined>;
  getSocketrelayRequestsByUser(userId: string): Promise<SocketrelayRequest[]>;
  getPublicSocketrelayRequestById(id: string): Promise<SocketrelayRequest | undefined>;
  listPublicSocketrelayRequests(): Promise<SocketrelayRequest[]>;
  updateSocketrelayRequestStatus(id: string, status: string): Promise<SocketrelayRequest>;
  deleteSocketrelayRequest(id: string): Promise<void>;

  // SocketRelay Fulfillment operations
  createSocketrelayFulfillment(requestId: string, fulfillerUserId: string): Promise<SocketrelayFulfillment>;
  getSocketrelayFulfillmentById(id: string): Promise<SocketrelayFulfillment | undefined>;
  getSocketrelayFulfillmentsByRequest(requestId: string): Promise<SocketrelayFulfillment[]>;
  getSocketrelayFulfillmentsByUser(userId: string): Promise<any[]>;
  getAllSocketrelayFulfillments(): Promise<any[]>;
  closeSocketrelayFulfillment(id: string, userId: string, status: string): Promise<SocketrelayFulfillment>;

  // SocketRelay Message operations
  createSocketrelayMessage(message: InsertSocketrelayMessage): Promise<SocketrelayMessage>;
  getSocketrelayMessagesByFulfillment(fulfillmentId: string): Promise<SocketrelayMessage[]>;

  // SocketRelay Profile operations
  getSocketrelayProfile(userId: string): Promise<SocketrelayProfile | undefined>;
  createSocketrelayProfile(profile: InsertSocketrelayProfile): Promise<SocketrelayProfile>;
  updateSocketrelayProfile(userId: string, profile: Partial<InsertSocketrelayProfile>): Promise<SocketrelayProfile>;

  // SocketRelay Announcement operations
  createSocketrelayAnnouncement(announcement: InsertSocketrelayAnnouncement): Promise<SocketrelayAnnouncement>;
  getActiveSocketrelayAnnouncements(): Promise<SocketrelayAnnouncement[]>;
  getAllSocketrelayAnnouncements(): Promise<SocketrelayAnnouncement[]>;
  updateSocketrelayAnnouncement(id: string, announcement: Partial<InsertSocketrelayAnnouncement>): Promise<SocketrelayAnnouncement>;
  deactivateSocketrelayAnnouncement(id: string): Promise<SocketrelayAnnouncement>;

  // Directory operations
  getDirectoryProfileById(id: string): Promise<DirectoryProfile | undefined>;
  getDirectoryProfileByUserId(userId: string): Promise<DirectoryProfile | undefined>;
  listAllDirectoryProfiles(): Promise<DirectoryProfile[]>;
  listPublicDirectoryProfiles(): Promise<DirectoryProfile[]>;
  createDirectoryProfile(profile: InsertDirectoryProfile): Promise<DirectoryProfile>;
  updateDirectoryProfile(id: string, profile: Partial<InsertDirectoryProfile>): Promise<DirectoryProfile>;
  deleteDirectoryProfile(id: string): Promise<void>;

  // Directory Announcement operations
  createDirectoryAnnouncement(announcement: InsertDirectoryAnnouncement): Promise<DirectoryAnnouncement>;
  getActiveDirectoryAnnouncements(): Promise<DirectoryAnnouncement[]>;
  getAllDirectoryAnnouncements(): Promise<DirectoryAnnouncement[]>;
  updateDirectoryAnnouncement(id: string, announcement: Partial<InsertDirectoryAnnouncement>): Promise<DirectoryAnnouncement>;
  deactivateDirectoryAnnouncement(id: string): Promise<DirectoryAnnouncement>;

  // Chat Groups operations
  getAllChatGroups(): Promise<ChatGroup[]>;
  getActiveChatGroups(): Promise<ChatGroup[]>;
  getChatGroupById(id: string): Promise<ChatGroup | undefined>;
  createChatGroup(group: InsertChatGroup): Promise<ChatGroup>;
  updateChatGroup(id: string, group: Partial<InsertChatGroup>): Promise<ChatGroup>;
  deleteChatGroup(id: string): Promise<void>;

  // ChatGroups Announcement operations
  createChatgroupsAnnouncement(announcement: InsertChatgroupsAnnouncement): Promise<ChatgroupsAnnouncement>;
  getActiveChatgroupsAnnouncements(): Promise<ChatgroupsAnnouncement[]>;
  getAllChatgroupsAnnouncements(): Promise<ChatgroupsAnnouncement[]>;
  updateChatgroupsAnnouncement(id: string, announcement: Partial<InsertChatgroupsAnnouncement>): Promise<ChatgroupsAnnouncement>;
  deactivateChatgroupsAnnouncement(id: string): Promise<ChatgroupsAnnouncement>;

  // Profile deletion operations with cascade anonymization
  deleteSupportMatchProfile(userId: string, reason?: string): Promise<void>;
  deleteLighthouseProfile(userId: string, reason?: string): Promise<void>;
  deleteSocketrelayProfile(userId: string, reason?: string): Promise<void>;
  deleteDirectoryProfileWithCascade(userId: string, reason?: string): Promise<void>;
  logProfileDeletion(userId: string, appName: string, reason?: string): Promise<ProfileDeletionLog>;
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
        target: users.email,
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

  async updateUserVerification(userId: string, isVerified: boolean): Promise<User> {
    // Update user verification
    const [user] = await db
      .update(users)
      .set({ 
        isVerified: !!isVerified,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Update all profiles belonging to this user across all apps
    // Directory profiles
    await db
      .update(directoryProfiles)
      .set({ isVerified: !!isVerified, updatedAt: new Date() })
      .where(eq(directoryProfiles.userId, userId));

    // Lighthouse profiles
    await db
      .update(lighthouseProfiles)
      .set({ isVerified: !!isVerified, updatedAt: new Date() })
      .where(eq(lighthouseProfiles.userId, userId));

    // SupportMatch profiles (if they have isVerified)
    // Note: SupportMatch may not have isVerified, so we skip if column doesn't exist
    try {
      await db
        .update(supportMatchProfiles)
        .set({ isVerified: !!isVerified, updatedAt: new Date() } as any)
        .where(eq(supportMatchProfiles.userId, userId));
    } catch (e) {
      // SupportMatch may not have isVerified field, ignore
    }

    return user;
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

  async getAllPricingTiers(): Promise<PricingTier[]> {
    return await db
      .select()
      .from(pricingTiers)
      .orderBy(desc(pricingTiers.effectiveDate));
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

  async setCurrentPricingTier(id: string): Promise<PricingTier> {
    // Unset all current tiers
    await db
      .update(pricingTiers)
      .set({ isCurrentTier: false })
      .where(eq(pricingTiers.isCurrentTier, true));

    // Set the specified tier as current
    const [tier] = await db
      .update(pricingTiers)
      .set({ isCurrentTier: true })
      .where(eq(pricingTiers.id, id))
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
    
    // Calculate outstanding revenue based on current active users
    const outstandingRevenue = allUsers.reduce((sum, user) => {
      if (user.subscriptionStatus === 'active') {
        return sum + parseFloat(user.pricingTier);
      }
      return sum;
    }, 0);

    // Calculate collected revenue from payments made this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthlyPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          gte(payments.paymentDate, startOfMonth),
          lte(payments.paymentDate, endOfMonth)
        )
      );
    
    const collectedMonthlyRevenue = monthlyPayments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount);
    }, 0);

    const activeInvites = allInvites.filter(invite => {
      const isNotExpired = !invite.expiresAt || new Date(invite.expiresAt) > new Date();
      const hasUsesRemaining = invite.currentUses < invite.maxUses;
      return isNotExpired && hasUsesRemaining;
    }).length;

    return {
      totalUsers: allUsers.length,
      activeInvites,
      collectedMonthlyRevenue: collectedMonthlyRevenue.toFixed(2),
      outstandingRevenue: outstandingRevenue.toFixed(2),
    };
  }
  
  // SupportMatch Profile operations
  async getSupportMatchProfile(userId: string): Promise<SupportMatchProfile | undefined> {
    const [profile] = await db
      .select()
      .from(supportMatchProfiles)
      .where(eq(supportMatchProfiles.userId, userId));
    return profile;
  }
  
  async createSupportMatchProfile(profileData: InsertSupportMatchProfile): Promise<SupportMatchProfile> {
    const [profile] = await db
      .insert(supportMatchProfiles)
      .values(profileData)
      .returning();
    return profile;
  }
  
  async updateSupportMatchProfile(userId: string, profileData: Partial<InsertSupportMatchProfile>): Promise<SupportMatchProfile> {
    const [profile] = await db
      .update(supportMatchProfiles)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(supportMatchProfiles.userId, userId))
      .returning();
    return profile;
  }
  
  async getAllActiveSupportMatchProfiles(): Promise<SupportMatchProfile[]> {
    return await db
      .select()
      .from(supportMatchProfiles)
      .where(eq(supportMatchProfiles.isActive, true));
  }
  
  async getAllSupportMatchProfiles(): Promise<SupportMatchProfile[]> {
    return await db
      .select()
      .from(supportMatchProfiles)
      .orderBy(desc(supportMatchProfiles.createdAt));
  }
  
  // SupportMatch Partnership operations
  async createPartnership(partnershipData: InsertPartnership): Promise<Partnership> {
    const [partnership] = await db
      .insert(partnerships)
      .values(partnershipData)
      .returning();
    return partnership;
  }
  
  async getPartnershipById(id: string): Promise<Partnership | undefined> {
    const [partnership] = await db
      .select()
      .from(partnerships)
      .where(eq(partnerships.id, id));
    return partnership;
  }
  
  async getActivePartnershipByUser(userId: string): Promise<any | undefined> {
    // First get the active partnership
    const [partnership] = await db
      .select()
      .from(partnerships)
      .where(
        and(
          or(
            eq(partnerships.user1Id, userId),
            eq(partnerships.user2Id, userId)
          ),
          eq(partnerships.status, 'active')
        )
      );
    
    if (!partnership) return undefined;
    
    // Determine which user is the partner
    const partnerId = partnership.user1Id === userId ? partnership.user2Id : partnership.user1Id;
    
    // Get the partner's profile
    const [partnerProfile] = await db
      .select()
      .from(supportMatchProfiles)
      .where(eq(supportMatchProfiles.userId, partnerId));
    
    return {
      ...partnership,
      partnerNickname: partnerProfile?.nickname || 'Unknown Partner',
      partnerGender: partnerProfile?.gender,
      partnerTimezone: partnerProfile?.timezone,
    };
  }
  
  async getAllPartnerships(): Promise<Partnership[]> {
    return await db
      .select()
      .from(partnerships)
      .orderBy(desc(partnerships.createdAt));
  }
  
  async getPartnershipHistory(userId: string): Promise<Partnership[]> {
    return await db
      .select()
      .from(partnerships)
      .where(
        or(
          eq(partnerships.user1Id, userId),
          eq(partnerships.user2Id, userId)
        )
      )
      .orderBy(desc(partnerships.startDate));
  }
  
  async updatePartnershipStatus(id: string, status: string): Promise<Partnership> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    
    // If ending the partnership, set the end date to now
    if (status === 'ended') {
      updateData.endDate = new Date();
    }
    
    const [partnership] = await db
      .update(partnerships)
      .set(updateData)
      .where(eq(partnerships.id, id))
      .returning();
    return partnership;
  }
  
  async createAlgorithmicMatches(): Promise<Partnership[]> {
    // Get all active profiles
    const allProfiles = await this.getAllActiveSupportMatchProfiles();
    
    // Get all active partnerships to filter out already matched users
    const activePartnerships = await db
      .select()
      .from(partnerships)
      .where(eq(partnerships.status, 'active'));
    
    const matchedUserIds = new Set<string>();
    activePartnerships.forEach(p => {
      matchedUserIds.add(p.user1Id);
      matchedUserIds.add(p.user2Id);
    });
    
    // Filter to only unmatched users
    const unmatchedProfiles = allProfiles.filter(p => !matchedUserIds.has(p.userId));
    
    // Get all exclusions
    const allExclusions = await db.select().from(exclusions);
    const exclusionMap = new Map<string, Set<string>>();
    allExclusions.forEach(e => {
      if (!exclusionMap.has(e.userId)) {
        exclusionMap.set(e.userId, new Set());
      }
      exclusionMap.get(e.userId)!.add(e.excludedUserId);
    });
    
    // Helper function to check if two users are compatible
    const areCompatible = (user1: typeof unmatchedProfiles[0], user2: typeof unmatchedProfiles[0]): boolean => {
      // Check gender preference compatibility (bidirectional)
      const user1GenderMatch = 
        user1.genderPreference === 'any' || 
        user1.genderPreference === user2.gender;
      
      const user2GenderMatch = 
        user2.genderPreference === 'any' || 
        user2.genderPreference === user1.gender;
      
      if (!user1GenderMatch || !user2GenderMatch) {
        return false;
      }
      
      // Check for mutual exclusion
      const user1Excludes = exclusionMap.get(user1.userId);
      const user2Excludes = exclusionMap.get(user2.userId);
      
      if (user1Excludes?.has(user2.userId) || user2Excludes?.has(user1.userId)) {
        return false;
      }
      
      // Timezone compatibility - respect both users' timezone preferences
      const user1WantsSameTimezone = user1.timezonePreference === 'same_timezone';
      const user2WantsSameTimezone = user2.timezonePreference === 'same_timezone';
      
      // If EITHER user requires same timezone matching, enforce timezone constraints
      // This ensures users who want same-timezone partners are never matched across timezones,
      // regardless of their potential partner's preference
      if (user1WantsSameTimezone || user2WantsSameTimezone) {
        // Both users must have a timezone set
        if (!user1.timezone || !user2.timezone) {
          return false;
        }
        // Timezones must match exactly
        if (user1.timezone !== user2.timezone) {
          return false;
        }
      }
      
      return true;
    };
    
    // Create matches using a simple greedy algorithm
    const createdPartnerships: Partnership[] = [];
    const matched = new Set<string>();
    
    for (let i = 0; i < unmatchedProfiles.length; i++) {
      const user1 = unmatchedProfiles[i];
      
      if (matched.has(user1.userId)) {
        continue;
      }
      
      // Find best match for user1
      let bestMatch = null;
      let bestScore = -1;
      
      for (let j = i + 1; j < unmatchedProfiles.length; j++) {
        const user2 = unmatchedProfiles[j];
        
        if (matched.has(user2.userId)) {
          continue;
        }
        
        if (areCompatible(user1, user2)) {
          // Calculate compatibility score
          let score = 0;
          
          // Same timezone is better
          if (user1.timezone && user2.timezone && user1.timezone === user2.timezone) {
            score += 10;
          }
          
          // Specific gender preferences are slightly better than "any"
          if (user1.genderPreference !== 'any' && user2.genderPreference !== 'any') {
            score += 5;
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = user2;
          }
        }
      }
      
      // Create partnership if a match was found
      if (bestMatch) {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30); // 30 days from start
        
        const partnership = await this.createPartnership({
          user1Id: user1.userId,
          user2Id: bestMatch.userId,
          startDate,
          endDate,
          status: 'active',
        });
        
        createdPartnerships.push(partnership);
        matched.add(user1.userId);
        matched.add(bestMatch.userId);
      }
    }
    
    return createdPartnerships;
  }
  
  // SupportMatch Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }
  
  async getMessagesByPartnership(partnershipId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.partnershipId, partnershipId))
      .orderBy(messages.createdAt);
  }
  
  // SupportMatch Exclusion operations
  async createExclusion(exclusionData: InsertExclusion): Promise<Exclusion> {
    const [exclusion] = await db
      .insert(exclusions)
      .values(exclusionData)
      .returning();
    return exclusion;
  }
  
  async getExclusionsByUser(userId: string): Promise<Exclusion[]> {
    return await db
      .select()
      .from(exclusions)
      .where(eq(exclusions.userId, userId))
      .orderBy(desc(exclusions.createdAt));
  }
  
  async checkMutualExclusion(user1Id: string, user2Id: string): Promise<boolean> {
    const exclusion = await db
      .select()
      .from(exclusions)
      .where(
        or(
          and(
            eq(exclusions.userId, user1Id),
            eq(exclusions.excludedUserId, user2Id)
          ),
          and(
            eq(exclusions.userId, user2Id),
            eq(exclusions.excludedUserId, user1Id)
          )
        )
      )
      .limit(1);
    return exclusion.length > 0;
  }
  
  async deleteExclusion(id: string): Promise<void> {
    await db.delete(exclusions).where(eq(exclusions.id, id));
  }
  
  // SupportMatch Report operations
  async createReport(reportData: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(reportData)
      .returning();
    return report;
  }
  
  async getAllReports(): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt));
  }
  
  async updateReportStatus(id: string, status: string, resolution?: string): Promise<Report> {
    const [report] = await db
      .update(reports)
      .set({
        status,
        resolution,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, id))
      .returning();
    return report;
  }
  
  // SupportMatch Announcement operations
  async createAnnouncement(announcementData: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db
      .insert(announcements)
      .values(announcementData)
      .returning();
    return announcement;
  }
  
  async getActiveAnnouncements(): Promise<Announcement[]> {
    const now = new Date();
    return await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.isActive, true),
          or(
            sql`${announcements.expiresAt} IS NULL`,
            gte(announcements.expiresAt, now)
          )
        )
      )
      .orderBy(desc(announcements.createdAt));
  }
  
  async getAllAnnouncements(): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
  }
  
  async updateAnnouncement(id: string, announcementData: Partial<InsertAnnouncement>): Promise<Announcement> {
    const [announcement] = await db
      .update(announcements)
      .set({
        ...announcementData,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();
    return announcement;
  }
  
  async deactivateAnnouncement(id: string): Promise<Announcement> {
    const [announcement] = await db
      .update(announcements)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();
    return announcement;
  }

  // SupportMatch App Announcement operations
  async createSupportmatchAnnouncement(announcementData: InsertSupportmatchAnnouncement): Promise<SupportmatchAnnouncement> {
    const [announcement] = await db
      .insert(supportmatchAnnouncements)
      .values(announcementData)
      .returning();
    return announcement;
  }
  
  async getActiveSupportmatchAnnouncements(): Promise<SupportmatchAnnouncement[]> {
    const now = new Date();
    return await db
      .select()
      .from(supportmatchAnnouncements)
      .where(
        and(
          eq(supportmatchAnnouncements.isActive, true),
          or(
            sql`${supportmatchAnnouncements.expiresAt} IS NULL`,
            gte(supportmatchAnnouncements.expiresAt, now)
          )
        )
      )
      .orderBy(desc(supportmatchAnnouncements.createdAt));
  }
  
  async getAllSupportmatchAnnouncements(): Promise<SupportmatchAnnouncement[]> {
    return await db
      .select()
      .from(supportmatchAnnouncements)
      .orderBy(desc(supportmatchAnnouncements.createdAt));
  }
  
  async updateSupportmatchAnnouncement(id: string, announcementData: Partial<InsertSupportmatchAnnouncement>): Promise<SupportmatchAnnouncement> {
    const [announcement] = await db
      .update(supportmatchAnnouncements)
      .set({
        ...announcementData,
        updatedAt: new Date(),
      })
      .where(eq(supportmatchAnnouncements.id, id))
      .returning();
    return announcement;
  }
  
  async deactivateSupportmatchAnnouncement(id: string): Promise<SupportmatchAnnouncement> {
    const [announcement] = await db
      .update(supportmatchAnnouncements)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(supportmatchAnnouncements.id, id))
      .returning();
    return announcement;
  }
  
  // SupportMatch Stats
  async getSupportMatchStats() {
    const activeProfiles = await db
      .select()
      .from(supportMatchProfiles)
      .where(eq(supportMatchProfiles.isActive, true));
      
    const currentPartnerships = await db
      .select()
      .from(partnerships)
      .where(eq(partnerships.status, 'active'));
      
    const pendingReportsCount = await db
      .select()
      .from(reports)
      .where(eq(reports.status, 'pending'));
    
    return {
      activeUsers: activeProfiles.length,
      currentPartnerships: currentPartnerships.length,
      pendingReports: pendingReportsCount.length,
    };
  }

  // ========================================
  // SLEEPSTORIES APP OPERATIONS
  // ========================================

  async createSleepStory(storyData: InsertSleepStory): Promise<SleepStory> {
    const [story] = await db
      .insert(sleepStories)
      .values(storyData)
      .returning();
    return story;
  }

  async getAllSleepStories(): Promise<SleepStory[]> {
    return await db
      .select()
      .from(sleepStories)
      .orderBy(desc(sleepStories.createdAt));
  }

  async getActiveSleepStories(): Promise<SleepStory[]> {
    return await db
      .select()
      .from(sleepStories)
      .where(eq(sleepStories.isActive, true))
      .orderBy(desc(sleepStories.createdAt));
  }

  async getSleepStoryById(id: string): Promise<SleepStory | undefined> {
    const [story] = await db
      .select()
      .from(sleepStories)
      .where(eq(sleepStories.id, id));
    return story;
  }

  async updateSleepStory(id: string, storyData: Partial<InsertSleepStory>): Promise<SleepStory> {
    const [story] = await db
      .update(sleepStories)
      .set({
        ...storyData,
        updatedAt: new Date(),
      })
      .where(eq(sleepStories.id, id))
      .returning();
    return story;
  }

  async deleteSleepStory(id: string): Promise<void> {
    await db
      .delete(sleepStories)
      .where(eq(sleepStories.id, id));
  }

  // SleepStories Announcement operations
  async createSleepStoriesAnnouncement(announcementData: InsertSleepStoriesAnnouncement): Promise<SleepStoriesAnnouncement> {
    const [announcement] = await db
      .insert(sleepStoriesAnnouncements)
      .values(announcementData)
      .returning();
    return announcement;
  }
  
  async getActiveSleepStoriesAnnouncements(): Promise<SleepStoriesAnnouncement[]> {
    const now = new Date();
    return await db
      .select()
      .from(sleepStoriesAnnouncements)
      .where(
        and(
          eq(sleepStoriesAnnouncements.isActive, true),
          or(
            sql`${sleepStoriesAnnouncements.expiresAt} IS NULL`,
            gte(sleepStoriesAnnouncements.expiresAt, now)
          )
        )
      )
      .orderBy(desc(sleepStoriesAnnouncements.createdAt));
  }
  
  async getAllSleepStoriesAnnouncements(): Promise<SleepStoriesAnnouncement[]> {
    return await db
      .select()
      .from(sleepStoriesAnnouncements)
      .orderBy(desc(sleepStoriesAnnouncements.createdAt));
  }
  
  async updateSleepStoriesAnnouncement(id: string, announcementData: Partial<InsertSleepStoriesAnnouncement>): Promise<SleepStoriesAnnouncement> {
    const [announcement] = await db
      .update(sleepStoriesAnnouncements)
      .set({
        ...announcementData,
        updatedAt: new Date(),
      })
      .where(eq(sleepStoriesAnnouncements.id, id))
      .returning();
    return announcement;
  }
  
  async deactivateSleepStoriesAnnouncement(id: string): Promise<SleepStoriesAnnouncement> {
    const [announcement] = await db
      .update(sleepStoriesAnnouncements)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(sleepStoriesAnnouncements.id, id))
      .returning();
    return announcement;
  }


  // ========================================
  // LIGHTHOUSE APP OPERATIONS
  // ========================================

  // Profile operations
  async createLighthouseProfile(profileData: InsertLighthouseProfile): Promise<LighthouseProfile> {
    const [profile] = await db
      .insert(lighthouseProfiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async getLighthouseProfileByUserId(userId: string): Promise<LighthouseProfile | undefined> {
    const [profile] = await db
      .select()
      .from(lighthouseProfiles)
      .where(eq(lighthouseProfiles.userId, userId));
    return profile;
  }

  async getLighthouseProfileById(id: string): Promise<LighthouseProfile | undefined> {
    const [profile] = await db
      .select()
      .from(lighthouseProfiles)
      .where(eq(lighthouseProfiles.id, id));
    return profile;
  }

  async updateLighthouseProfile(id: string, profileData: Partial<InsertLighthouseProfile>): Promise<LighthouseProfile> {
    const [profile] = await db
      .update(lighthouseProfiles)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(lighthouseProfiles.id, id))
      .returning();
    return profile;
  }

  async getAllLighthouseProfiles(): Promise<LighthouseProfile[]> {
    return await db
      .select()
      .from(lighthouseProfiles)
      .orderBy(desc(lighthouseProfiles.createdAt));
  }

  async getLighthouseProfilesByType(profileType: string): Promise<LighthouseProfile[]> {
    return await db
      .select()
      .from(lighthouseProfiles)
      .where(and(
        eq(lighthouseProfiles.profileType, profileType),
        eq(lighthouseProfiles.isActive, true)
      ))
      .orderBy(desc(lighthouseProfiles.createdAt));
  }

  // Property operations
  async createLighthouseProperty(propertyData: InsertLighthouseProperty): Promise<LighthouseProperty> {
    const [property] = await db
      .insert(lighthouseProperties)
      .values(propertyData)
      .returning();
    return property;
  }

  async getLighthousePropertyById(id: string): Promise<LighthouseProperty | undefined> {
    const [property] = await db
      .select()
      .from(lighthouseProperties)
      .where(eq(lighthouseProperties.id, id));
    return property;
  }

  async getPropertiesByHost(hostId: string): Promise<LighthouseProperty[]> {
    return await db
      .select()
      .from(lighthouseProperties)
      .where(eq(lighthouseProperties.hostId, hostId))
      .orderBy(desc(lighthouseProperties.createdAt));
  }

  async getAllActiveProperties(): Promise<LighthouseProperty[]> {
    return await db
      .select()
      .from(lighthouseProperties)
      .where(eq(lighthouseProperties.isActive, true))
      .orderBy(desc(lighthouseProperties.createdAt));
  }

  async getAllProperties(): Promise<LighthouseProperty[]> {
    return await db
      .select()
      .from(lighthouseProperties)
      .orderBy(desc(lighthouseProperties.createdAt));
  }

  async updateLighthouseProperty(id: string, propertyData: Partial<InsertLighthouseProperty>): Promise<LighthouseProperty> {
    const [property] = await db
      .update(lighthouseProperties)
      .set({
        ...propertyData,
        updatedAt: new Date(),
      })
      .where(eq(lighthouseProperties.id, id))
      .returning();
    return property;
  }

  async deleteLighthouseProperty(id: string): Promise<void> {
    await db
      .delete(lighthouseProperties)
      .where(eq(lighthouseProperties.id, id));
  }

  // Match operations
  async createLighthouseMatch(matchData: InsertLighthouseMatch): Promise<LighthouseMatch> {
    const [match] = await db
      .insert(lighthouseMatches)
      .values(matchData)
      .returning();
    return match;
  }

  async getLighthouseMatchById(id: string): Promise<LighthouseMatch | undefined> {
    const [match] = await db
      .select()
      .from(lighthouseMatches)
      .where(eq(lighthouseMatches.id, id));
    return match;
  }

  async getMatchesBySeeker(seekerId: string): Promise<LighthouseMatch[]> {
    return await db
      .select()
      .from(lighthouseMatches)
      .where(eq(lighthouseMatches.seekerId, seekerId))
      .orderBy(desc(lighthouseMatches.createdAt));
  }

  async getMatchesByProperty(propertyId: string): Promise<LighthouseMatch[]> {
    return await db
      .select()
      .from(lighthouseMatches)
      .where(eq(lighthouseMatches.propertyId, propertyId))
      .orderBy(desc(lighthouseMatches.createdAt));
  }

  async getMatchesByProfile(profileId: string): Promise<LighthouseMatch[]> {
    // Get matches where user is seeker
    const seekerMatches = await db
      .select()
      .from(lighthouseMatches)
      .where(eq(lighthouseMatches.seekerId, profileId));
    
    // Get matches where user is host (via their properties)
    const userProperties = await this.getPropertiesByHost(profileId);
    const propertyIds = userProperties.map(p => p.id);
    
    if (propertyIds.length === 0) {
      return seekerMatches;
    }
    
    const hostMatches = await db
      .select()
      .from(lighthouseMatches)
      .where(
        sql`${lighthouseMatches.propertyId} IN (${sql.join(propertyIds.map(id => sql`${id}`), sql`, `)})`
      );
    
    // Combine and deduplicate
    const allMatches = [...seekerMatches, ...hostMatches];
    const uniqueMatches = Array.from(
      new Map(allMatches.map(m => [m.id, m])).values()
    );
    
    return uniqueMatches;
  }

  async getAllMatches(): Promise<LighthouseMatch[]> {
    return await db
      .select()
      .from(lighthouseMatches)
      .orderBy(desc(lighthouseMatches.createdAt));
  }

  async getAllLighthouseMatches(): Promise<LighthouseMatch[]> {
    return await db
      .select()
      .from(lighthouseMatches)
      .orderBy(desc(lighthouseMatches.createdAt));
  }

  async updateLighthouseMatch(id: string, matchData: Partial<InsertLighthouseMatch>): Promise<LighthouseMatch> {
    const [match] = await db
      .update(lighthouseMatches)
      .set({
        ...matchData,
        updatedAt: new Date(),
      })
      .where(eq(lighthouseMatches.id, id))
      .returning();
    return match;
  }

  // Stats
  async getLighthouseStats() {
    const seekers = await db
      .select()
      .from(lighthouseProfiles)
      .where(and(
        eq(lighthouseProfiles.profileType, 'seeker'),
        eq(lighthouseProfiles.isActive, true)
      ));
      
    const hosts = await db
      .select()
      .from(lighthouseProfiles)
      .where(and(
        eq(lighthouseProfiles.profileType, 'host'),
        eq(lighthouseProfiles.isActive, true)
      ));
      
    const properties = await db
      .select()
      .from(lighthouseProperties)
      .where(eq(lighthouseProperties.isActive, true));
      
    const activeMatchesResult = await db
      .select()
      .from(lighthouseMatches)
      .where(or(
        eq(lighthouseMatches.status, 'pending'),
        eq(lighthouseMatches.status, 'accepted')
      ));
      
    const completedMatchesResult = await db
      .select()
      .from(lighthouseMatches)
      .where(eq(lighthouseMatches.status, 'completed'));
    
    return {
      totalSeekers: seekers.length,
      totalHosts: hosts.length,
      totalProperties: properties.length,
      activeMatches: activeMatchesResult.length,
      completedMatches: completedMatchesResult.length,
    };
  }

  // LightHouse Announcement operations
  async createLighthouseAnnouncement(announcementData: InsertLighthouseAnnouncement): Promise<LighthouseAnnouncement> {
    const [announcement] = await db
      .insert(lighthouseAnnouncements)
      .values(announcementData)
      .returning();
    return announcement;
  }
  
  async getActiveLighthouseAnnouncements(): Promise<LighthouseAnnouncement[]> {
    const now = new Date();
    return await db
      .select()
      .from(lighthouseAnnouncements)
      .where(
        and(
          eq(lighthouseAnnouncements.isActive, true),
          or(
            sql`${lighthouseAnnouncements.expiresAt} IS NULL`,
            gte(lighthouseAnnouncements.expiresAt, now)
          )
        )
      )
      .orderBy(desc(lighthouseAnnouncements.createdAt));
  }
  
  async getAllLighthouseAnnouncements(): Promise<LighthouseAnnouncement[]> {
    return await db
      .select()
      .from(lighthouseAnnouncements)
      .orderBy(desc(lighthouseAnnouncements.createdAt));
  }
  
  async updateLighthouseAnnouncement(id: string, announcementData: Partial<InsertLighthouseAnnouncement>): Promise<LighthouseAnnouncement> {
    const [announcement] = await db
      .update(lighthouseAnnouncements)
      .set({
        ...announcementData,
        updatedAt: new Date(),
      })
      .where(eq(lighthouseAnnouncements.id, id))
      .returning();
    return announcement;
  }
  
  async deactivateLighthouseAnnouncement(id: string): Promise<LighthouseAnnouncement> {
    const [announcement] = await db
      .update(lighthouseAnnouncements)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(lighthouseAnnouncements.id, id))
      .returning();
    return announcement;
  }

  // SocketRelay Request operations
  async createSocketrelayRequest(userId: string, description: string, isPublic: boolean = false): Promise<SocketrelayRequest> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 days from now

    const [request] = await db
      .insert(socketrelayRequests)
      .values({
        userId,
        description,
        isPublic: !!isPublic,
        expiresAt,
      })
      .returning();
    return request;
  }

  async getActiveSocketrelayRequests(): Promise<any[]> {
    const now = new Date();
    const requests = await db
      .select()
      .from(socketrelayRequests)
      .where(
        and(
          eq(socketrelayRequests.status, 'active'),
          gte(socketrelayRequests.expiresAt, now)
        )
      )
      .orderBy(desc(socketrelayRequests.createdAt));
    
    // Join with creator profiles to get location data
    const results = await Promise.all(
      requests.map(async (request) => {
        const profile = await this.getSocketrelayProfile(request.userId);
        return {
          ...request,
          creatorProfile: profile ? {
            city: profile.city,
            state: profile.state,
            country: profile.country,
            displayName: profile.displayName,
          } : null,
        };
      })
    );
    
    return results;
  }

  async getSocketrelayRequestById(id: string): Promise<SocketrelayRequest | undefined> {
    const [request] = await db
      .select()
      .from(socketrelayRequests)
      .where(eq(socketrelayRequests.id, id));
    return request;
  }

  async getPublicSocketrelayRequestById(id: string): Promise<SocketrelayRequest | undefined> {
    const now = new Date();
    const [request] = await db
      .select()
      .from(socketrelayRequests)
      .where(
        and(
          eq(socketrelayRequests.id, id),
          eq(socketrelayRequests.isPublic, true),
          eq(socketrelayRequests.status, 'active'),
          gte(socketrelayRequests.expiresAt, now)
        )
      );
    return request;
  }

  async listPublicSocketrelayRequests(): Promise<SocketrelayRequest[]> {
    const now = new Date();
    return await db
      .select()
      .from(socketrelayRequests)
      .where(
        and(
          eq(socketrelayRequests.isPublic, true),
          eq(socketrelayRequests.status, 'active'),
          gte(socketrelayRequests.expiresAt, now)
        )
      )
      .orderBy(desc(socketrelayRequests.createdAt));
  }

  async getAllSocketrelayRequests(): Promise<any[]> {
    const requests = await db
      .select()
      .from(socketrelayRequests)
      .orderBy(desc(socketrelayRequests.createdAt));
    
    // Join with creator profiles to get location data
    const results = await Promise.all(
      requests.map(async (request) => {
        const profile = await this.getSocketrelayProfile(request.userId);
        return {
          ...request,
          creatorProfile: profile ? {
            city: profile.city,
            state: profile.state,
            country: profile.country,
            displayName: profile.displayName,
          } : null,
        };
      })
    );
    
    return results;
  }

  async getSocketrelayRequestsByUser(userId: string): Promise<SocketrelayRequest[]> {
    return await db
      .select()
      .from(socketrelayRequests)
      .where(eq(socketrelayRequests.userId, userId))
      .orderBy(desc(socketrelayRequests.createdAt));
  }

  async updateSocketrelayRequestStatus(id: string, status: string): Promise<SocketrelayRequest> {
    const [request] = await db
      .update(socketrelayRequests)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(socketrelayRequests.id, id))
      .returning();
    return request;
  }

  async deleteSocketrelayRequest(id: string): Promise<void> {
    // First, get all fulfillments for this request
    const fulfillments = await this.getSocketrelayFulfillmentsByRequest(id);
    
    // Delete messages for each fulfillment
    for (const fulfillment of fulfillments) {
      await db
        .delete(socketrelayMessages)
        .where(eq(socketrelayMessages.fulfillmentId, fulfillment.id));
    }
    
    // Delete all fulfillments for this request
    await db
      .delete(socketrelayFulfillments)
      .where(eq(socketrelayFulfillments.requestId, id));
    
    // Finally, delete the request itself
    await db
      .delete(socketrelayRequests)
      .where(eq(socketrelayRequests.id, id));
  }

  // SocketRelay Fulfillment operations
  async createSocketrelayFulfillment(requestId: string, fulfillerUserId: string): Promise<SocketrelayFulfillment> {
    const [fulfillment] = await db
      .insert(socketrelayFulfillments)
      .values({
        requestId,
        fulfillerUserId,
      })
      .returning();

    // Update request status to fulfilled
    await this.updateSocketrelayRequestStatus(requestId, 'fulfilled');

    return fulfillment;
  }

  async getSocketrelayFulfillmentById(id: string): Promise<SocketrelayFulfillment | undefined> {
    const [fulfillment] = await db
      .select()
      .from(socketrelayFulfillments)
      .where(eq(socketrelayFulfillments.id, id));
    return fulfillment;
  }

  async getSocketrelayFulfillmentsByRequest(requestId: string): Promise<SocketrelayFulfillment[]> {
    return await db
      .select()
      .from(socketrelayFulfillments)
      .where(eq(socketrelayFulfillments.requestId, requestId))
      .orderBy(desc(socketrelayFulfillments.createdAt));
  }

  async getSocketrelayFulfillmentsByUser(userId: string): Promise<any[]> {
    const fulfillments = await db
      .select()
      .from(socketrelayFulfillments)
      .where(eq(socketrelayFulfillments.fulfillerUserId, userId))
      .orderBy(desc(socketrelayFulfillments.createdAt));
    
    const results = await Promise.all(
      fulfillments.map(async (fulfillment) => {
        const request = await this.getSocketrelayRequestById(fulfillment.requestId);
        return { ...fulfillment, request };
      })
    );
    
    return results;
  }

  async getAllSocketrelayFulfillments(): Promise<any[]> {
    const fulfillments = await db
      .select()
      .from(socketrelayFulfillments)
      .orderBy(desc(socketrelayFulfillments.createdAt));
    
    const results = await Promise.all(
      fulfillments.map(async (fulfillment) => {
        const request = await this.getSocketrelayRequestById(fulfillment.requestId);
        return { ...fulfillment, request };
      })
    );
    
    return results;
  }

  async closeSocketrelayFulfillment(id: string, userId: string, status: string): Promise<SocketrelayFulfillment> {
    const [fulfillment] = await db
      .update(socketrelayFulfillments)
      .set({
        status,
        closedBy: userId,
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(socketrelayFulfillments.id, id))
      .returning();
    return fulfillment;
  }

  // SocketRelay Message operations
  async createSocketrelayMessage(messageData: InsertSocketrelayMessage): Promise<SocketrelayMessage> {
    const [message] = await db
      .insert(socketrelayMessages)
      .values(messageData)
      .returning();
    return message;
  }

  async getSocketrelayMessagesByFulfillment(fulfillmentId: string): Promise<SocketrelayMessage[]> {
    return await db
      .select()
      .from(socketrelayMessages)
      .where(eq(socketrelayMessages.fulfillmentId, fulfillmentId))
      .orderBy(socketrelayMessages.createdAt);
  }

  // SocketRelay Profile operations
  async getSocketrelayProfile(userId: string): Promise<SocketrelayProfile | undefined> {
    const [profile] = await db
      .select()
      .from(socketrelayProfiles)
      .where(eq(socketrelayProfiles.userId, userId));
    return profile;
  }

  async createSocketrelayProfile(profileData: InsertSocketrelayProfile): Promise<SocketrelayProfile> {
    const [profile] = await db
      .insert(socketrelayProfiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async updateSocketrelayProfile(userId: string, profileData: Partial<InsertSocketrelayProfile>): Promise<SocketrelayProfile> {
    const [profile] = await db
      .update(socketrelayProfiles)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(socketrelayProfiles.userId, userId))
      .returning();
    return profile;
  }

  // SocketRelay Announcement operations
  async createSocketrelayAnnouncement(announcementData: InsertSocketrelayAnnouncement): Promise<SocketrelayAnnouncement> {
    const [announcement] = await db
      .insert(socketrelayAnnouncements)
      .values(announcementData)
      .returning();
    return announcement;
  }
  
  async getActiveSocketrelayAnnouncements(): Promise<SocketrelayAnnouncement[]> {
    const now = new Date();
    return await db
      .select()
      .from(socketrelayAnnouncements)
      .where(
        and(
          eq(socketrelayAnnouncements.isActive, true),
          or(
            sql`${socketrelayAnnouncements.expiresAt} IS NULL`,
            gte(socketrelayAnnouncements.expiresAt, now)
          )
        )
      )
      .orderBy(desc(socketrelayAnnouncements.createdAt));
  }
  
  async getAllSocketrelayAnnouncements(): Promise<SocketrelayAnnouncement[]> {
    return await db
      .select()
      .from(socketrelayAnnouncements)
      .orderBy(desc(socketrelayAnnouncements.createdAt));
  }
  
  async updateSocketrelayAnnouncement(id: string, announcementData: Partial<InsertSocketrelayAnnouncement>): Promise<SocketrelayAnnouncement> {
    const [announcement] = await db
      .update(socketrelayAnnouncements)
      .set({
        ...announcementData,
        updatedAt: new Date(),
      })
      .where(eq(socketrelayAnnouncements.id, id))
      .returning();
    return announcement;
  }
  
  async deactivateSocketrelayAnnouncement(id: string): Promise<SocketrelayAnnouncement> {
    const [announcement] = await db
      .update(socketrelayAnnouncements)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(socketrelayAnnouncements.id, id))
      .returning();
    return announcement;
  }

  // ========================================
  // DIRECTORY APP OPERATIONS
  // ========================================

  async getDirectoryProfileById(id: string): Promise<DirectoryProfile | undefined> {
    const [profile] = await db
      .select()
      .from(directoryProfiles)
      .where(eq(directoryProfiles.id, id));
    return profile;
  }

  async getDirectoryProfileByUserId(userId: string): Promise<DirectoryProfile | undefined> {
    const [profile] = await db
      .select()
      .from(directoryProfiles)
      .where(eq(directoryProfiles.userId, userId));
    return profile;
  }

  async listAllDirectoryProfiles(): Promise<DirectoryProfile[]> {
    return await db
      .select()
      .from(directoryProfiles)
      .orderBy(desc(directoryProfiles.createdAt));
  }

  async listPublicDirectoryProfiles(): Promise<DirectoryProfile[]> {
    return await db
      .select()
      .from(directoryProfiles)
      .where(eq(directoryProfiles.isPublic, true))
      .orderBy(desc(directoryProfiles.createdAt));
  }

  async createDirectoryProfile(profileData: InsertDirectoryProfile): Promise<DirectoryProfile> {
    const [profile] = await db
      .insert(directoryProfiles)
      .values({
        ...profileData,
        // Description is optional at schema level; store empty string if missing
        description: (profileData as any).description ?? "",
        // Enforce max 3 skills at storage layer as defense-in-depth
        skills: (profileData.skills ?? []).slice(0, 3),
      })
      .returning();
    return profile;
  }

  async updateDirectoryProfile(id: string, profileData: Partial<InsertDirectoryProfile>): Promise<DirectoryProfile> {
    const updateData: any = {
      ...profileData,
      skills: profileData.skills ? profileData.skills.slice(0, 3) : undefined,
      updatedAt: new Date(),
    };
    // Remove null values that shouldn't be set to null in the DB
    if (updateData.description === null) delete updateData.description;
    const [profile] = await db
      .update(directoryProfiles)
      .set(updateData)
      .where(eq(directoryProfiles.id, id))
      .returning();
    return profile;
  }

  async deleteDirectoryProfile(id: string): Promise<void> {
    await db.delete(directoryProfiles).where(eq(directoryProfiles.id, id));
  }

  // Directory Announcement operations
  async createDirectoryAnnouncement(announcementData: InsertDirectoryAnnouncement): Promise<DirectoryAnnouncement> {
    const [announcement] = await db
      .insert(directoryAnnouncements)
      .values(announcementData)
      .returning();
    return announcement;
  }
  
  async getActiveDirectoryAnnouncements(): Promise<DirectoryAnnouncement[]> {
    const now = new Date();
    return await db
      .select()
      .from(directoryAnnouncements)
      .where(
        and(
          eq(directoryAnnouncements.isActive, true),
          or(
            sql`${directoryAnnouncements.expiresAt} IS NULL`,
            gte(directoryAnnouncements.expiresAt, now)
          )
        )
      )
      .orderBy(desc(directoryAnnouncements.createdAt));
  }
  
  async getAllDirectoryAnnouncements(): Promise<DirectoryAnnouncement[]> {
    return await db
      .select()
      .from(directoryAnnouncements)
      .orderBy(desc(directoryAnnouncements.createdAt));
  }
  
  async updateDirectoryAnnouncement(id: string, announcementData: Partial<InsertDirectoryAnnouncement>): Promise<DirectoryAnnouncement> {
    const [announcement] = await db
      .update(directoryAnnouncements)
      .set({
        ...announcementData,
        updatedAt: new Date(),
      })
      .where(eq(directoryAnnouncements.id, id))
      .returning();
    return announcement;
  }
  
  async deactivateDirectoryAnnouncement(id: string): Promise<DirectoryAnnouncement> {
    const [announcement] = await db
      .update(directoryAnnouncements)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(directoryAnnouncements.id, id))
      .returning();
    return announcement;
  }

  // ========================================
  // CHAT GROUPS APP OPERATIONS
  // ========================================

  async getAllChatGroups(): Promise<ChatGroup[]> {
    return await db
      .select()
      .from(chatGroups)
      .orderBy(asc(chatGroups.displayOrder), desc(chatGroups.createdAt));
  }

  async getActiveChatGroups(): Promise<ChatGroup[]> {
    return await db
      .select()
      .from(chatGroups)
      .where(eq(chatGroups.isActive, true))
      .orderBy(asc(chatGroups.displayOrder), desc(chatGroups.createdAt));
  }

  async getChatGroupById(id: string): Promise<ChatGroup | undefined> {
    const [group] = await db
      .select()
      .from(chatGroups)
      .where(eq(chatGroups.id, id));
    return group;
  }

  async createChatGroup(groupData: InsertChatGroup): Promise<ChatGroup> {
    const [group] = await db
      .insert(chatGroups)
      .values(groupData)
      .returning();
    return group;
  }

  async updateChatGroup(id: string, groupData: Partial<InsertChatGroup>): Promise<ChatGroup> {
    const [group] = await db
      .update(chatGroups)
      .set({
        ...groupData,
        updatedAt: new Date(),
      })
      .where(eq(chatGroups.id, id))
      .returning();
    return group;
  }

  async deleteChatGroup(id: string): Promise<void> {
    await db.delete(chatGroups).where(eq(chatGroups.id, id));
  }

  // ChatGroups Announcement operations
  async createChatgroupsAnnouncement(announcementData: InsertChatgroupsAnnouncement): Promise<ChatgroupsAnnouncement> {
    const [announcement] = await db
      .insert(chatgroupsAnnouncements)
      .values(announcementData)
      .returning();
    return announcement;
  }
  
  async getActiveChatgroupsAnnouncements(): Promise<ChatgroupsAnnouncement[]> {
    const now = new Date();
    return await db
      .select()
      .from(chatgroupsAnnouncements)
      .where(
        and(
          eq(chatgroupsAnnouncements.isActive, true),
          or(
            sql`${chatgroupsAnnouncements.expiresAt} IS NULL`,
            gte(chatgroupsAnnouncements.expiresAt, now)
          )
        )
      )
      .orderBy(desc(chatgroupsAnnouncements.createdAt));
  }
  
  async getAllChatgroupsAnnouncements(): Promise<ChatgroupsAnnouncement[]> {
    return await db
      .select()
      .from(chatgroupsAnnouncements)
      .orderBy(desc(chatgroupsAnnouncements.createdAt));
  }
  
  async updateChatgroupsAnnouncement(id: string, announcementData: Partial<InsertChatgroupsAnnouncement>): Promise<ChatgroupsAnnouncement> {
    const [announcement] = await db
      .update(chatgroupsAnnouncements)
      .set({
        ...announcementData,
        updatedAt: new Date(),
      })
      .where(eq(chatgroupsAnnouncements.id, id))
      .returning();
    return announcement;
  }
  
  async deactivateChatgroupsAnnouncement(id: string): Promise<ChatgroupsAnnouncement> {
    const [announcement] = await db
      .update(chatgroupsAnnouncements)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(chatgroupsAnnouncements.id, id))
      .returning();
    return announcement;
  }

  // ========================================
  // PROFILE DELETION OPERATIONS
  // ========================================

  /**
   * Generates an anonymized user ID in the format: deleted_user_[random_string]
   */
  private generateAnonymizedUserId(): string {
    const randomString = randomBytes(16).toString('hex');
    return `deleted_user_${randomString}`;
  }

  /**
   * Logs a profile deletion for auditing purposes
   */
  async logProfileDeletion(userId: string, appName: string, reason?: string): Promise<ProfileDeletionLog> {
    const [log] = await db
      .insert(profileDeletionLogs)
      .values({
        userId,
        appName,
        reason: reason || null,
      })
      .returning();
    return log;
  }

  /**
   * Deletes a SupportMatch profile and anonymizes all related data
   */
  async deleteSupportMatchProfile(userId: string, reason?: string): Promise<void> {
    try {
      // Get profile first
      const profile = await this.getSupportMatchProfile(userId);
      if (!profile) {
        throw new Error("SupportMatch profile not found");
      }

      const anonymizedUserId = this.generateAnonymizedUserId();

      // SupportMatch foreign keys reference supportMatchProfiles.userId, which references users.id
      // So we need to create both a temp user and temp profile
      try {
        await db
          .insert(users)
          .values({
            id: anonymizedUserId,
            email: null,
            firstName: "Deleted",
            lastName: "User",
            isAdmin: false,
            isVerified: false,
          });
      } catch (error: any) {
        // If user already exists (from previous deletion), that's fine
        if (!error.message?.includes("duplicate key") && !error.message?.includes("unique constraint")) {
          throw error;
        }
      }

      // Create a temporary anonymized profile to satisfy foreign key constraints
      try {
        await db
          .insert(supportMatchProfiles)
          .values({
            userId: anonymizedUserId,
            nickname: "Deleted User",
            isActive: false,
          });
      } catch (error: any) {
        // If profile already exists (from previous deletion), that's fine
        if (!error.message?.includes("duplicate key") && !error.message?.includes("unique constraint")) {
          throw error;
        }
      }

      // Anonymize partnerships (user1Id and user2Id)
      await db
        .update(partnerships)
        .set({ user1Id: anonymizedUserId })
        .where(eq(partnerships.user1Id, userId));
      
      await db
        .update(partnerships)
        .set({ user2Id: anonymizedUserId })
        .where(eq(partnerships.user2Id, userId));

      // Anonymize messages (senderId)
      await db
        .update(messages)
        .set({ senderId: anonymizedUserId })
        .where(eq(messages.senderId, userId));

      // Anonymize exclusions (userId and excludedUserId)
      await db
        .update(exclusions)
        .set({ userId: anonymizedUserId })
        .where(eq(exclusions.userId, userId));
      
      await db
        .update(exclusions)
        .set({ excludedUserId: anonymizedUserId })
        .where(eq(exclusions.excludedUserId, userId));

      // Anonymize reports (reporterId and reportedUserId)
      await db
        .update(reports)
        .set({ reporterId: anonymizedUserId })
        .where(eq(reports.reporterId, userId));
      
      await db
        .update(reports)
        .set({ reportedUserId: anonymizedUserId })
        .where(eq(reports.reportedUserId, userId));

      // Delete the original profile
      await db.delete(supportMatchProfiles).where(eq(supportMatchProfiles.userId, userId));

      // Log the deletion (don't fail if logging fails)
      try {
        await this.logProfileDeletion(userId, "supportmatch", reason);
      } catch (error) {
        console.error("Failed to log profile deletion:", error);
        // Continue even if logging fails
      }
    } catch (error: any) {
      console.error("Error in deleteSupportMatchProfile:", error);
      // Re-throw with more context
      throw new Error(`Failed to delete SupportMatch profile: ${error.message || "Unknown error"}`);
    }
  }

  /**
   * Deletes a LightHouse profile and anonymizes all related data
   */
  async deleteLighthouseProfile(userId: string, reason?: string): Promise<void> {
    try {
      // Get profile first
      console.log(`[deleteLighthouseProfile] Starting deletion for userId: ${userId}`);
      const profile = await this.getLighthouseProfileByUserId(userId);
      if (!profile) {
        console.log(`[deleteLighthouseProfile] Profile not found for userId: ${userId}`);
        throw new Error("LightHouse profile not found");
      }
      console.log(`[deleteLighthouseProfile] Found profile with id: ${profile.id}`);

      // Get all properties owned by this profile
      const properties = await this.getPropertiesByHost(profile.id);
      console.log(`[deleteLighthouseProfile] Found ${properties.length} properties to delete`);

      // Delete matches where this profile is the seeker
      // Note: lighthouseMatches references lighthouseProfiles.id, not userId
      // Since we can't easily anonymize profile.id references, we delete the matches
      const matches = await this.getMatchesBySeeker(profile.id);
      console.log(`[deleteLighthouseProfile] Found ${matches.length} matches as seeker to delete`);
      for (const match of matches) {
        // Delete matches as they become invalid without the profile
        await db.delete(lighthouseMatches).where(eq(lighthouseMatches.id, match.id));
      }

      // Delete all properties owned by this profile
      for (const property of properties) {
        // Delete matches associated with these properties first
        const propertyMatches = await this.getMatchesByProperty(property.id);
        console.log(`[deleteLighthouseProfile] Found ${propertyMatches.length} matches for property ${property.id} to delete`);
        for (const match of propertyMatches) {
          await db.delete(lighthouseMatches).where(eq(lighthouseMatches.id, match.id));
        }
        // Then delete the property
        console.log(`[deleteLighthouseProfile] Deleting property ${property.id}`);
        await db.delete(lighthouseProperties).where(eq(lighthouseProperties.id, property.id));
      }

      // Delete the profile
      console.log(`[deleteLighthouseProfile] Deleting profile with id: ${profile.id}, userId: ${userId}`);
      const deleteResult = await db.delete(lighthouseProfiles).where(eq(lighthouseProfiles.userId, userId));
      console.log(`[deleteLighthouseProfile] Delete result:`, deleteResult);

      // Verify deletion
      const verifyProfile = await this.getLighthouseProfileByUserId(userId);
      if (verifyProfile) {
        console.error(`[deleteLighthouseProfile] ERROR: Profile still exists after deletion! Profile id: ${verifyProfile.id}`);
        throw new Error("Profile deletion failed - profile still exists after delete operation");
      }
      console.log(`[deleteLighthouseProfile] Verified profile deletion successful`);

      // Log the deletion (don't fail if logging fails)
      try {
        await this.logProfileDeletion(userId, "lighthouse", reason);
      } catch (error) {
        console.error("Failed to log profile deletion:", error);
        // Continue even if logging fails
      }
    } catch (error: any) {
      console.error("Error in deleteLighthouseProfile:", error);
      // Re-throw with more context
      throw new Error(`Failed to delete LightHouse profile: ${error.message || "Unknown error"}`);
    }
  }

  /**
   * Deletes a SocketRelay profile and anonymizes all related data
   */
  async deleteSocketrelayProfile(userId: string, reason?: string): Promise<void> {
    try {
      // Get profile first
      const profile = await this.getSocketrelayProfile(userId);
      if (!profile) {
        throw new Error("SocketRelay profile not found");
      }

      const anonymizedUserId = this.generateAnonymizedUserId();

      // SocketRelay foreign keys reference users.id, so we need to create a temp user
      // to satisfy foreign key constraints when anonymizing
      try {
        await db
          .insert(users)
          .values({
            id: anonymizedUserId,
            email: null,
            firstName: "Deleted",
            lastName: "User",
            isAdmin: false,
            isVerified: false,
          });
      } catch (error: any) {
        // If user already exists (from previous deletion), that's fine
        if (!error.message?.includes("duplicate key") && !error.message?.includes("unique constraint")) {
          throw error;
        }
      }

      // Anonymize requests (userId references users.id)
      await db
        .update(socketrelayRequests)
        .set({ userId: anonymizedUserId })
        .where(eq(socketrelayRequests.userId, userId));

      // Anonymize fulfillments (fulfillerUserId and closedBy reference users.id)
      await db
        .update(socketrelayFulfillments)
        .set({ fulfillerUserId: anonymizedUserId })
        .where(eq(socketrelayFulfillments.fulfillerUserId, userId));
      
      await db
        .update(socketrelayFulfillments)
        .set({ closedBy: anonymizedUserId })
        .where(eq(socketrelayFulfillments.closedBy, userId));

      // Anonymize messages (senderId references users.id)
      await db
        .update(socketrelayMessages)
        .set({ senderId: anonymizedUserId })
        .where(eq(socketrelayMessages.senderId, userId));

      // Delete the profile
      await db.delete(socketrelayProfiles).where(eq(socketrelayProfiles.userId, userId));

      // Log the deletion (don't fail if logging fails)
      try {
        await this.logProfileDeletion(userId, "socketrelay", reason);
      } catch (error) {
        console.error("Failed to log profile deletion:", error);
        // Continue even if logging fails
      }
    } catch (error: any) {
      console.error("Error in deleteSocketrelayProfile:", error);
      // Re-throw with more context
      throw new Error(`Failed to delete SocketRelay profile: ${error.message || "Unknown error"}`);
    }
  }

  /**
   * Deletes a Directory profile with cascade handling (Directory has no relational data to anonymize)
   */
  async deleteDirectoryProfileWithCascade(userId: string, reason?: string): Promise<void> {
    // Get profile first
    const profile = await this.getDirectoryProfileByUserId(userId);
    if (!profile) {
      throw new Error("Directory profile not found");
    }

    // Delete the profile
    await db.delete(directoryProfiles).where(eq(directoryProfiles.userId, userId));

    // Log the deletion (don't fail if logging fails)
    try {
      await this.logProfileDeletion(userId, "directory", reason);
    } catch (error) {
      console.error("Failed to log profile deletion:", error);
      // Continue even if logging fails
    }
  }
}

export const storage = new DatabaseStorage();

import { db } from "../server/db";
import {
  users,
  supportMatchProfiles,
  partnerships,
  messages,
  exclusions,
  reports,
  supportmatchAnnouncements,
  type InsertSupportMatchProfile,
  type InsertPartnership,
  type InsertMessage,
  type InsertExclusion,
  type InsertReport,
  type InsertSupportmatchAnnouncement,
} from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedSupportMatch() {
  console.log("Creating SupportMatch seed data...");

  // Create test users for SupportMatch
  const testUsers = [
    { email: "supportmatch1@example.com", firstName: "Alex", lastName: "Martinez" },
    { email: "supportmatch2@example.com", firstName: "Jordan", lastName: "Kim" },
    { email: "supportmatch3@example.com", firstName: "Taylor", lastName: "Brown" },
    { email: "supportmatch4@example.com", firstName: "Morgan", lastName: "Davis" },
    { email: "supportmatch5@example.com", firstName: "Casey", lastName: "Wilson" },
  ];

  const userIds: Record<string, string> = {};

  for (const userData of testUsers) {
    try {
      const [user] = await db
        .insert(users)
        .values({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isApproved: true,
          isAdmin: false,
        })
        .returning();

      userIds[userData.email] = user.id;
      console.log(`Created user: ${userData.email}`);
    } catch (error) {
      // User might already exist, try to get their ID
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));

      if (existingUser) {
        userIds[userData.email] = existingUser.id;
        console.log(`User ${userData.email} already exists, using existing ID`);
      }
    }
  }

  // Create SupportMatch profiles
  const profilesData: InsertSupportMatchProfile[] = [
    {
      userId: userIds["supportmatch1@example.com"],
      nickname: "Alex M.",
      gender: "female",
      genderPreference: "female",
      city: "Portland",
      state: "Oregon",
      country: "United States",
      timezone: "America/Los_Angeles",
      timezonePreference: "same_timezone",
      isActive: true,
    },
    {
      userId: userIds["supportmatch2@example.com"],
      nickname: "Jordan K.",
      gender: "male",
      genderPreference: "any",
      city: "Seattle",
      state: "Washington",
      country: "United States",
      timezone: "America/Los_Angeles",
      timezonePreference: "any_timezone",
      isActive: true,
    },
    {
      userId: userIds["supportmatch3@example.com"],
      nickname: "Taylor B.",
      gender: "prefer-not-to-say",
      genderPreference: "any",
      city: "San Francisco",
      state: "California",
      country: "United States",
      timezone: "America/Los_Angeles",
      timezonePreference: "same_timezone",
      isActive: true,
    },
    {
      userId: userIds["supportmatch4@example.com"],
      nickname: "Morgan D.",
      gender: "female",
      genderPreference: "female",
      city: "Portland",
      state: "Oregon",
      country: "United States",
      timezone: "America/Los_Angeles",
      timezonePreference: "same_timezone",
      isActive: true,
    },
    {
      userId: userIds["supportmatch5@example.com"],
      nickname: "Casey W.",
      gender: "male",
      genderPreference: "male",
      city: "Seattle",
      state: "Washington",
      country: "United States",
      timezone: "America/Los_Angeles",
      timezonePreference: "any_timezone",
      isActive: true,
    },
  ];

  const profileUserIds: Record<string, string> = {};

  for (const profileData of profilesData) {
    try {
      await db.insert(supportMatchProfiles).values(profileData);
      profileUserIds[profileData.userId!] = profileData.userId!;
      console.log(`Created profile for user: ${profileData.userId}`);
    } catch (error) {
      console.log(`Profile for user ${profileData.userId} already exists`);
      profileUserIds[profileData.userId!] = profileData.userId!;
    }
  }

  // Create partnerships
  const partnershipsData: InsertPartnership[] = [
    {
      user1Id: userIds["supportmatch1@example.com"],
      user2Id: userIds["supportmatch4@example.com"],
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      status: "active",
    },
    {
      user1Id: userIds["supportmatch2@example.com"],
      user2Id: userIds["supportmatch5@example.com"],
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      status: "active",
    },
  ];

  const createdPartnerships: any[] = [];

  for (const partnershipData of partnershipsData) {
    try {
      const [partnership] = await db
        .insert(partnerships)
        .values(partnershipData)
        .returning();
      createdPartnerships.push(partnership);
      console.log(`Created partnership between ${partnershipData.user1Id} and ${partnershipData.user2Id}`);
    } catch (error) {
      console.log(`Error creating partnership:`, error);
    }
  }

  // Create messages for partnerships
  if (createdPartnerships.length > 0) {
    const messagesData: InsertMessage[] = [
      {
        partnershipId: createdPartnerships[0].id,
        senderId: userIds["supportmatch1@example.com"],
        content: "Hi! Looking forward to our partnership. How are you doing today?",
      },
      {
        partnershipId: createdPartnerships[0].id,
        senderId: userIds["supportmatch4@example.com"],
        content: "Hello! I'm doing well, thank you for asking. Excited to work together!",
      },
      {
        partnershipId: createdPartnerships[1].id,
        senderId: userIds["supportmatch2@example.com"],
        content: "Good morning! Hope you're having a great day.",
      },
    ];

    for (const messageData of messagesData) {
      try {
        await db.insert(messages).values(messageData);
        console.log(`Created message in partnership ${messageData.partnershipId}`);
      } catch (error) {
        console.log(`Error creating message:`, error);
      }
    }
  }

  // Create exclusions
  const exclusionsData: InsertExclusion[] = [
    {
      userId: userIds["supportmatch1@example.com"],
      excludedUserId: userIds["supportmatch3@example.com"],
      reason: "Personal preference",
    },
  ];

  for (const exclusionData of exclusionsData) {
    try {
      await db.insert(exclusions).values(exclusionData);
      console.log(`Created exclusion for user ${exclusionData.userId}`);
    } catch (error) {
      console.log(`Error creating exclusion:`, error);
    }
  }

  // Create reports
  const reportsData: InsertReport[] = [
    {
      reporterId: userIds["supportmatch2@example.com"],
      reportedUserId: userIds["supportmatch3@example.com"],
      reason: "inappropriate_behavior",
      description: "Reported user sent inappropriate messages",
      status: "pending",
    },
  ];

  for (const reportData of reportsData) {
    try {
      await db.insert(reports).values(reportData);
      console.log(`Created report from ${reportData.reporterId}`);
    } catch (error) {
      console.log(`Error creating report:`, error);
    }
  }

  // Seed SupportMatch announcements
  const announcementsData: InsertSupportmatchAnnouncement[] = [
    {
      title: "Welcome to SupportMatch",
      content: "SupportMatch helps you find accountability partners for your healing journey. Create your profile and get matched with compatible partners.",
      type: "info",
      isActive: true,
      expiresAt: null,
    },
    {
      title: "Monthly Partnership Cycle",
      content: "New partnerships are formed at the beginning of each month. Make sure your profile is complete and active to be included in the next matching cycle.",
      type: "update",
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    {
      title: "Safety Reminder",
      content: "Remember to report any inappropriate behavior. Your safety is our top priority. All reports are reviewed by our moderation team.",
      type: "warning",
      isActive: true,
      expiresAt: null,
    },
  ];

  for (const announcementData of announcementsData) {
    try {
      await db.insert(supportmatchAnnouncements).values(announcementData);
      console.log(`Created SupportMatch announcement: ${announcementData.title}`);
    } catch (error) {
      console.log(`Error creating announcement "${announcementData.title}":`, error);
    }
  }

  console.log("\n✅ SupportMatch seed data created successfully!");
  console.log("\nSummary:");
  console.log(`- ${testUsers.length} users created`);
  console.log(`- ${profilesData.length} profiles created`);
  console.log(`- ${partnershipsData.length} partnerships created`);
  console.log(`- ${messagesData.length} messages created`);
  console.log(`- ${exclusionsData.length} exclusions created`);
  console.log(`- ${reportsData.length} reports created`);
  console.log(`- ${announcementsData.length} announcements created`);

  process.exit(0);
}

seedSupportMatch().catch((error) => {
  console.error("Error seeding SupportMatch data:", error);
  process.exit(1);
});




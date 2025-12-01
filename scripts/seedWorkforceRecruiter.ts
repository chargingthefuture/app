import { db } from "../server/db";
import {
  users,
  workforceRecruiterProfiles,
  workforceRecruiterConfig,
  workforceRecruiterOccupations,
  workforceRecruiterAnnouncements,
} from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedWorkforceRecruiter() {
  console.log("🌱 Seeding Workforce Recruiter data...");

  const recruiters = [
    {
      email: "recruiter1@example.com",
      firstName: "Amina",
      lastName: "Santos",
      organizationName: "Safe Horizons Collective",
      city: "Oakland",
      country: "United States",
      missionStatement: "Provide dignified vocational placements for survivors interested in logistics and healthcare.",
      primaryIndustries: "Healthcare, Logistics",
      regionsServed: "West Coast, Remote-friendly",
      intakeCapacity: 12,
    },
    {
      email: "recruiter2@example.com",
      firstName: "Leo",
      lastName: "Martinez",
      organizationName: "Bright Path Mutual Aid",
      city: "Chicago",
      country: "United States",
      missionStatement: "Match bilingual survivors with trauma-informed workplaces in education and advocacy.",
      primaryIndustries: "Education, Advocacy",
      regionsServed: "Midwest, Remote",
      intakeCapacity: 8,
    },
  ];
const recruiterUserIds: string[] = [];

  for (const recruiter of recruiters) {
    let userRecord = await db.select().from(users).where(eq(users.email, recruiter.email));
    if (userRecord.length === 0) {
      const [createdUser] = await db
        .insert(users)
        .values({
          email: recruiter.email,
          firstName: recruiter.firstName,
          lastName: recruiter.lastName,
          isApproved: true,
          isVerified: true,
        })
        .returning();
      userRecord = [createdUser];
      console.log(`Created user ${recruiter.email}`);
    }

    const userId = userRecord[0].id;
    if (!recruiterUserIds.includes(userId)) {
      recruiterUserIds.push(userId);
    }

    const [existingProfile] = await db
      .select()
      .from(workforceRecruiterProfiles)
      .where(eq(workforceRecruiterProfiles.userId, userId));

    if (!existingProfile) {
      await db.insert(workforceRecruiterProfiles).values({
        userId,
        organizationName: recruiter.organizationName,
        missionStatement: recruiter.missionStatement,
        primaryIndustries: recruiter.primaryIndustries,
        city: recruiter.city,
        country: recruiter.country,
        regionsServed: recruiter.regionsServed,
        intakeCapacity: recruiter.intakeCapacity,
        contactEmail: recruiter.email,
      });
      console.log(`Created Workforce Recruiter profile for ${recruiter.organizationName}`);
    }
  }

  const [existingConfig] = await db.select().from(workforceRecruiterConfig).limit(1);
  if (!existingConfig) {
    await db.insert(workforceRecruiterConfig).values({
      intakeStatus: "open",
      primaryContactEmail: "workforce@psyopfree.app",
      reviewCadenceDays: 14,
      highlightedIndustries: ["Healthcare", "Education", "Logistics"],
      applicationFormUrl: "https://example.org/workforce-intake",
      notes: "Seeded default configuration for local development.",
    });
    console.log("Created default Workforce Recruiter config");
  }

  const occupations = [
    {
      title: "Community Health Liaison",
      description: "Partner clinic seeking empathetic patient advocates to coordinate appointments and follow ups.",
      priorityLevel: "critical",
      regionFocus: "Remote, California",
      talentPoolSize: 18,
      activeOpportunities: 3,
      preferredSkills: "Spanish bilingual, basic EMR experience",
    },
    {
      title: "Mutual Aid Logistics Coordinator",
      description: "Coordinate deliveries for a mutual aid network serving four states.",
      priorityLevel: "high",
      regionFocus: "Great Lakes region",
      talentPoolSize: 9,
      activeOpportunities: 2,
      preferredSkills: "Routing, spreadsheet proficiency, calm communication",
    },
  ];

  for (const occupation of occupations) {
    const [existing] = await db
      .select()
      .from(workforceRecruiterOccupations)
      .where(eq(workforceRecruiterOccupations.title, occupation.title));

    if (!existing) {
      await db.insert(workforceRecruiterOccupations).values({
        ...occupation,
        createdBy: recruiterUserIds[0] || null,
      });
      console.log(`Created Workforce Recruiter occupation: ${occupation.title}`);
    }
  }

  const [announcement] = await db
    .select()
    .from(workforceRecruiterAnnouncements)
    .where(eq(workforceRecruiterAnnouncements.title, "Q1 Intake Window"))
    .limit(1);

  if (!announcement) {
    await db.insert(workforceRecruiterAnnouncements).values({
      title: "Q1 Intake Window",
      content: "We are prioritizing healthcare and logistics placements through March 31. Submit your profile updates to be considered.",
      type: "update",
      audience: "recruiters",
    });
    console.log("Created Workforce Recruiter announcement");
  }

  console.log("✅ Workforce Recruiter seed data created successfully!");
}

seedWorkforceRecruiter()
  .then(() => {
    console.log("Seeding complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding error:", error);
    process.exit(1);
  });

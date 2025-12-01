import { db } from "../server/db";
import {
  users,
  workforceRecruiterProfiles,
  workforceRecruiterConfig,
  workforceRecruiterOccupations,
} from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedWorkforceRecruiter() {
  console.log("🌱 Seeding Workforce Recruiter data...");

  const survivorEmail = "workforce.survivor@example.com";
  const adminEmail = "workforce.admin@example.com";

  const userRecords: Record<string, string> = {};

  for (const user of [
    { email: survivorEmail, firstName: "Willow", lastName: "Rivera", isAdmin: false },
    { email: adminEmail, firstName: "Rowan", lastName: "Nguyen", isAdmin: true },
  ]) {
    const [existing] = await db.select().from(users).where(eq(users.email, user.email));
    if (existing) {
      userRecords[user.email] = existing.id;
      console.log(`User ${user.email} already exists`);
      continue;
    }
    const [created] = await db
      .insert(users)
      .values({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        isApproved: true,
        isVerified: true,
      })
      .returning();
    userRecords[user.email] = created.id;
    console.log(`Created user: ${user.email}`);
  }

  const [config] = await db.select().from(workforceRecruiterConfig).limit(1);
  if (!config) {
    await db.insert(workforceRecruiterConfig).values({
      applicationStatus: "open",
      maxActiveCandidates: 35,
      featuredSectors: "Healthcare · Remote Ops · Skilled Trades",
      priorityRegions: "North America · LATAM",
      contactEmail: "workforce@chargingthefuture.com",
      intakeNotes: "Seeded config",
      allowSelfReferral: true,
      requireProfileReview: true,
    });
    console.log("Created default configuration");
  }

  const survivorId = userRecords[survivorEmail];
  if (survivorId) {
    const [existingProfile] = await db
      .select()
      .from(workforceRecruiterProfiles)
      .where(eq(workforceRecruiterProfiles.userId, survivorId));

    if (!existingProfile) {
      await db.insert(workforceRecruiterProfiles).values({
        userId: survivorId,
        fullName: "Willow Rivera",
        preferredName: "Willow",
        currentRole: "Community Navigator",
        experienceLevel: "mid",
        yearsExperience: 6,
        preferredIndustries: "Community Safety, Public Health",
        preferredRoles: "Program operations",
        keySkills: "Bilingual, crisis coordination, logistics",
        country: "United States",
        city: "Seattle",
        remotePreference: "hybrid",
        relocationSupportNeeded: true,
        availabilityTimeline: "Available in 4 weeks",
        supportNeeds: "Quiet workspace, flexible hours",
        impactStatement: "Looking for placements that fund survivor-led care teams.",
        linkedinUrl: "https://linkedin.com/in/willow",
      });
      console.log("Created sample survivor profile");
    }
  }

  const occupations = [
    {
      title: "Community Safety Coordinator",
      sector: "Human Services",
      description: "Coordinate safe housing leads, manage encrypted comms, and document incidents for the resiliency pod.",
      demandLevel: "urgent" as const,
      openRoles: 3,
      annualCompensationUsd: 72000,
      locations: "Remote · Seattle",
      skillsEmphasis: "De-escalation, crisis logistics",
      trainingResources: "Signal security stipend, monthly therapy credits",
      supportNotes: "Requires reliable broadband and weekly restorative circles",
      isRemoteFriendly: true,
      isActive: true,
    },
    {
      title: "Supply Chain Liaison",
      sector: "Operations",
      description: "Track donations, negotiate survivor-controlled contracts, and forecast inventory for mobile clinics.",
      demandLevel: "high" as const,
      openRoles: 2,
      annualCompensationUsd: 68000,
      locations: "Remote · Mexico City",
      skillsEmphasis: "Excel, bilingual, vendor management",
      trainingResources: "Warehouse safety certification, trauma-informed procurement training",
      supportNotes: "Requires flexible scheduling to align with survivor travel",
      isRemoteFriendly: true,
      isActive: true,
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
        createdBy: userRecords[adminEmail],
      });
      console.log(`Created occupation: ${occupation.title}`);
    }
  }

  console.log("✅ Workforce Recruiter seed complete");
}

seedWorkforceRecruiter()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding error:", error);
    process.exit(1);
  });

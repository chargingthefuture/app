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

  // Ensure there is at least one config row
  const [existingConfig] = await db.select().from(workforceRecruiterConfig).limit(1);
  if (!existingConfig) {
    await db.insert(workforceRecruiterConfig).values({
      isPortalOpen: true,
      maxActiveApplications: 3,
      highlightMessage: "Pairing survivors with trauma-informed employers offering relocation support.",
      supportEmail: "workforce@psyopfree.org",
      emergencySignalNumber: "+12345678900",
      applicationGuidelines: "Share skills, safety needs, and preferred work setting so we can advocate for you.",
      featuredRegions: "Pacific Northwest, Mountain West, Southern US",
      trainingPartners: "Community gardens, maker labs, allied co-ops",
      autoShareProfileWithAllies: false,
    });
    console.log("✅ Created Workforce Recruiter config");
  } else {
    console.log("ℹ️ Workforce Recruiter config already exists");
  }

  // Create or fetch demo user
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "workforce.candidate@example.com"));

  const demoUserId =
    existingUser?.id ||
    (
      await db
        .insert(users)
        .values({
          email: "workforce.candidate@example.com",
          firstName: "Camila",
          lastName: "Rivera",
          isApproved: true,
        })
        .returning()
    )[0].id;

  // Seed profile for demo user if missing
  const [existingProfile] = await db
    .select()
    .from(workforceRecruiterProfiles)
    .where(eq(workforceRecruiterProfiles.userId, demoUserId));

  if (!existingProfile) {
    await db.insert(workforceRecruiterProfiles).values({
      userId: demoUserId,
      displayName: "Camila R.",
      headline: "Restoration specialist & peer mentor",
      summary:
        "Agriculture + light fabrication experience. Seeking trauma-informed employers that respect flexible pacing.",
      availabilityStatus: "immediately_available",
      preferredWorkSetting: "hybrid",
      preferredRoleTypes: "horticulture, fabrication, peer-support",
      yearsExperience: 6,
      primarySkills: "irrigation, hydroponics, welding, peer-coaching",
      supportNeeds: "Predictable hours, signal contact, stipend for therapy",
      focusAreas: "food sovereignty, mutual aid logistics",
      languages: "English, Spanish",
      city: "Portland",
      state: "Oregon",
      country: "United States",
      timezone: "America/Los_Angeles",
      openToRemote: true,
      openToRelocation: false,
      profileVisibility: true,
      highlightedIndustries: "Community gardens, circular manufacturing",
      resumeUrl: "https://example.com/resume/camila.pdf",
      portfolioUrl: "https://example.com/portfolio/camila",
      signalUrl: "https://signal.me/#p/+12345678900",
      safetyNotes: "Needs advanced notice before background checks",
    });
    console.log("✅ Created Workforce Recruiter profile");
  } else {
    console.log("ℹ️ Workforce Recruiter profile already exists");
  }

  const occupations = [
    {
      title: "Healing Garden Coordinator",
      category: "Regenerative Agriculture",
      description:
        "Lead micro-farm plots inside safe houses, coordinating volunteers and trauma-informed schedules.",
      demandLevel: "high",
      requiredSkills: "Soil science basics, volunteer coordination, trauma-informed communication",
      supportProvided: "Transportation stipends, bilingual supervision, somatic therapy sessions",
      trainingDurationWeeks: 6,
      openRoles: 8,
      candidatesReady: 4,
      avgHourlyRate: "28.00",
      regionFocus: "Pacific Northwest",
      applicationUrl: "https://example.com/healing-garden",
      isPriorityRole: true,
    },
    {
      title: "Micro-Fabrication Apprentice",
      category: "Light Manufacturing",
      description:
        "Paid apprenticeship manufacturing surveillance countermeasures and secure hardware at allied co-ops.",
      demandLevel: "critical",
      requiredSkills: "Attention to detail, comfort with soldering, willingness to learn CAD",
      supportProvided: "Protective housing partners, Signal mentorship, on-site advocates",
      trainingDurationWeeks: 12,
      openRoles: 5,
      candidatesReady: 2,
      avgHourlyRate: "32.00",
      regionFocus: "Southwest",
      applicationUrl: "https://example.com/microfabrication",
      isPriorityRole: true,
    },
    {
      title: "Community Tech Navigator",
      category: "Digital Stewardship",
      description:
        "Support trauma-informed co-ops by deploying secure devices, onboarding survivors, and collecting feedback.",
      demandLevel: "medium",
      requiredSkills: "Basic networking, de-escalation, multilingual outreach",
      supportProvided: "Equipment stipends, travel escorts, emergency lodging",
      trainingDurationWeeks: 4,
      openRoles: 10,
      candidatesReady: 6,
      avgHourlyRate: "26.00",
      regionFocus: "Nationwide",
      applicationUrl: "https://example.com/tech-navigator",
      isPriorityRole: false,
    },
  ];

  for (const occupation of occupations) {
    const [existingOccupation] = await db
      .select()
      .from(workforceRecruiterOccupations)
      .where(eq(workforceRecruiterOccupations.title, occupation.title));

    if (!existingOccupation) {
      await db.insert(workforceRecruiterOccupations).values(occupation);
      console.log(`✅ Created occupation: ${occupation.title}`);
    } else {
      console.log(`ℹ️ Occupation already exists: ${occupation.title}`);
    }
  }

  const announcements = [
    {
      title: "Signal-Verified Employers Added",
      content:
        "Three co-ops finished trauma-informed onboarding. Profiles are shared only after survivor consent.",
      type: "update",
      targetAudience: "all",
    },
    {
      title: "Emergency Housing + Work Pairings",
      content:
        "Immediate roles for survivors needing relocation within 72 hours. Contact workforce desk via Signal.",
      type: "warning",
      targetAudience: "job_seekers",
    },
  ];

  for (const announcement of announcements) {
    const [existingAnnouncement] = await db
      .select()
      .from(workforceRecruiterAnnouncements)
      .where(eq(workforceRecruiterAnnouncements.title, announcement.title));

    if (!existingAnnouncement) {
      await db.insert(workforceRecruiterAnnouncements).values(announcement);
      console.log(`✅ Created announcement: ${announcement.title}`);
    } else {
      console.log(`ℹ️ Announcement already exists: ${announcement.title}`);
    }
  }

  console.log("🎉 Workforce Recruiter seed complete!");
}

seedWorkforceRecruiter()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Workforce Recruiter seed failed:", error);
    process.exit(1);
  });

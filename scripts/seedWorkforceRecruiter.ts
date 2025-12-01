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
  console.log("🌱 Seeding Workforce Recruiter mini-app...");

  const recruiterEmail = "recruiter@example.com";
  let recruiterUserId: string;

  const [existingUser] = await db.select().from(users).where(eq(users.email, recruiterEmail));
  if (existingUser) {
    recruiterUserId = existingUser.id;
    console.log(`User ${recruiterEmail} already exists`);
  } else {
    const [createdUser] = await db
      .insert(users)
      .values({
        email: recruiterEmail,
        firstName: "Wind",
        lastName: "Catcher",
        isApproved: true,
        isVerified: true,
      })
      .returning();
    recruiterUserId = createdUser.id;
    console.log(`Created seed user: ${recruiterEmail}`);
  }

  const [profile] = await db
    .select()
    .from(workforceRecruiterProfiles)
    .where(eq(workforceRecruiterProfiles.userId, recruiterUserId));

  if (!profile) {
    await db.insert(workforceRecruiterProfiles).values({
      userId: recruiterUserId,
      fullName: "Wind Catcher",
      organization: "Liberation Futures",
      role: "Lead Workforce Navigator",
      missionFocus: "Placing survivors in trauma-informed employers with living wages.",
      focusRegions: "Pacific Northwest, Mountain West",
      focusIndustries: "Clean tech, Public Interest Law",
      country: "United States",
      state: "Oregon",
      city: "Portland",
      timezone: "PST",
      contactEmail: recruiterEmail,
      contactPhone: "+1-415-555-0118",
      signalHandle: "https://signal.me/#p/+14155550118",
      preferredContactMethod: "signal",
      capacity: 6,
      availabilityStatus: "open",
      acceptsInternational: false,
      languages: "English, Spanish",
      linkedinUrl: "https://linkedin.com/in/wind-catcher",
      notes: "Specializes in survivor-led organizations and flexible remote placements.",
    });
    console.log("Created Workforce Recruiter profile");
  } else {
    console.log("Workforce Recruiter profile already exists");
  }

  const [config] = await db.select().from(workforceRecruiterConfig).limit(1);
  if (!config) {
    await db.insert(workforceRecruiterConfig).values({
      intakeStatus: "open",
      highlightMessage:
        "We prioritize trauma-informed teams and survivor-led companies. Expect weekly syncs.",
      supportEmail: "workforce@psyop-free.org",
      supportSignal: "https://signal.me/#p/+15555551234",
      supportPhone: "+1-415-555-0118",
      applicationLink: "https://the-comic.com/workforce-recruiter/apply",
      resourcesLink: "https://psyop-free.org/workforce-recruiter/resources",
      maxActiveRecruiters: 60,
      placementsGoalMonthly: 30,
      enableWaitlist: true,
    });
    console.log("Created Workforce Recruiter config");
  } else {
    console.log("Workforce Recruiter config already exists");
  }

  const occupations = [
    {
      occupationName: "Trauma-informed Outreach Coordinator",
      regionFocus: "Remote (US time zones)",
      priorityLevel: "critical",
      talentPoolSize: 18,
      urgentOpenings: 6,
      placementsLast30Days: 3,
      avgTimeToFillDays: 28,
      supportNeeded: "Clients need remote-first placements with flexible hours and peer support.",
      isActive: true,
    },
    {
      occupationName: "Policy Research Analyst",
      regionFocus: "Washington DC / Remote",
      priorityLevel: "priority",
      talentPoolSize: 12,
      urgentOpenings: 4,
      placementsLast30Days: 2,
      avgTimeToFillDays: 35,
      supportNeeded: "Security clearances and peer mentoring for survivors re-entering public service.",
      isActive: true,
    },
    {
      occupationName: "Systems Administrator (Mission-driven)",
      regionFocus: "Portland, OR",
      priorityLevel: "standard",
      talentPoolSize: 9,
      urgentOpenings: 2,
      placementsLast30Days: 1,
      avgTimeToFillDays: 45,
      supportNeeded: "Clients request stipends for co-working passes and mentorship buddies.",
      isActive: true,
    },
  ];

  for (const occupation of occupations) {
    const [existingOccupation] = await db
      .select()
      .from(workforceRecruiterOccupations)
      .where(eq(workforceRecruiterOccupations.occupationName, occupation.occupationName));
    if (!existingOccupation) {
      await db.insert(workforceRecruiterOccupations).values(occupation);
      console.log(`Created occupation: ${occupation.occupationName}`);
    }
  }

  const [existingAnnouncement] = await db
    .select()
    .from(workforceRecruiterAnnouncements)
    .limit(1);
  if (!existingAnnouncement) {
    await db.insert(workforceRecruiterAnnouncements).values({
      title: "Cohort 7 onboarding window",
      content:
        "We're onboarding new recruiters through March 15. Update your availability after each placement.",
      type: "info",
      isActive: true,
    });
    console.log("Created Workforce Recruiter announcement");
  }

  console.log("✅ Workforce Recruiter seed complete");
}

seedWorkforceRecruiter()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Workforce Recruiter seed failed", error);
    process.exit(1);
  });

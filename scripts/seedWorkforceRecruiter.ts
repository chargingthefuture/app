import { db } from "../server/db";
import {
  workforceRecruiterConfig,
  workforceRecruiterOccupations,
  workforceRecruiterAnnouncements,
} from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedWorkforceRecruiter() {
  console.log("Seeding Workforce Recruiter data...");

  const defaultConfig = {
    slug: "primary",
    heroTitle: "Rapid Workforce Recruiter",
    heroSubtitle:
      "Deploy trauma-informed responders, hotline teams, and investigators within 48 hours anywhere in the network.",
    primaryCtaLabel: "Request Critical Talent",
    primaryCtaUrl: "https://the-comic.com/forms/workforce-support",
    supportEmail: "ops@the-comic.com",
    supportPhone: "+1-415-555-0118",
    applicationFormUrl: "https://the-comic.com/forms/workforce-recruiter",
    highlightedStats: [
      { label: "Ready-to-Deploy Specialists", value: "180 candidates" },
      { label: "Average Deployment Time", value: "36 hours" },
      { label: "Critical Placements (Q3)", value: "42 teams" },
    ],
    industries: [
      "Shelter Operations",
      "Hotline & Digital Intake",
      "Investigations",
      "Transportation & Logistics",
      "Peer Support",
    ],
    supportChannels: [
      { label: "Operations Email", value: "ops@the-comic.com" },
      { label: "Signal (24/7)", value: "+1-415-555-0180" },
    ],
  };

  const [existingConfig] = await db
    .select()
    .from(workforceRecruiterConfig)
    .where(eq(workforceRecruiterConfig.slug, "primary"))
    .limit(1);

  if (!existingConfig) {
    await db.insert(workforceRecruiterConfig).values(defaultConfig);
    console.log("Created default Workforce Recruiter config");
  } else {
    console.log("Workforce Recruiter config already exists, skipping");
  }

  const occupations = [
    {
      occupationName: "Shelter Operations Lead",
      region: "US-East",
      category: "Shelter Operations",
      openRoles: 12,
      activeCandidates: 34,
      placementsLast30Days: 6,
      avgTimeToFillDays: 28,
      isPriority: true,
      spotlightMessage: "High-urgency deployments for warming centers and emergency shelters.",
    },
    {
      occupationName: "Hotline & Digital Intake Specialist",
      region: "Remote",
      category: "Hotline Support",
      openRoles: 18,
      activeCandidates: 46,
      placementsLast30Days: 11,
      avgTimeToFillDays: 18,
      isPriority: true,
      spotlightMessage: "Bilingual trauma-informed responders for encrypted channels.",
    },
    {
      occupationName: "Investigations Analyst",
      region: "US-West",
      category: "Investigations",
      openRoles: 8,
      activeCandidates: 21,
      placementsLast30Days: 5,
      avgTimeToFillDays: 41,
      isPriority: false,
      spotlightMessage: "OSINT, supply-chain tracing, and survivor-led investigations.",
    },
  ];

  for (const occupation of occupations) {
    const [existing] = await db
      .select()
      .from(workforceRecruiterOccupations)
      .where(eq(workforceRecruiterOccupations.occupationName, occupation.occupationName))
      .limit(1);

    if (existing) {
      await db
        .update(workforceRecruiterOccupations)
        .set({
          ...occupation,
          updatedAt: new Date(),
        })
        .where(eq(workforceRecruiterOccupations.id, existing.id));
      console.log(`Updated occupation: ${occupation.occupationName}`);
    } else {
      await db.insert(workforceRecruiterOccupations).values(occupation);
      console.log(`Created occupation: ${occupation.occupationName}`);
    }
  }

  const announcements = [
    {
      title: "Critical Coverage Needed: Winter Rapid-Response",
      content:
        "Shelter partners need 10 trauma-informed supervisors for rapid deployment to winter warming centers. Priority given to bilingual candidates.",
      type: "warning",
      priorityLevel: "high",
      isActive: true,
    },
    {
      title: "Digital Intake Expansion",
      content:
        "Hotline and encrypted DM intake pilots expanding to three new metro areas. Looking for peer navigators comfortable with Signal and Matrix.",
      type: "update",
      priorityLevel: "normal",
      isActive: true,
    },
  ];

  for (const announcement of announcements) {
    const [existing] = await db
      .select()
      .from(workforceRecruiterAnnouncements)
      .where(eq(workforceRecruiterAnnouncements.title, announcement.title))
      .limit(1);

    if (existing) {
      console.log(`Announcement already exists: ${announcement.title}`);
      continue;
    }

    await db.insert(workforceRecruiterAnnouncements).values(announcement);
    console.log(`Created announcement: ${announcement.title}`);
  }

  console.log("Workforce Recruiter seed completed.");
}

seedWorkforceRecruiter()
  .then(() => {
    console.log("Seed finished successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed Workforce Recruiter data", error);
    process.exit(1);
  });

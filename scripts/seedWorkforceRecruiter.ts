import { db } from "../server/db";
import {
  users,
  workforceRecruiterProfiles,
  workforceRecruiterConfig,
  workforceRecruiterAnnouncements,
  workforceRecruiterOccupations,
} from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedWorkforceRecruiter() {
  console.log("🌱 Seeding Workforce Recruiter data...");

  const recruiterUsers = [
    { email: "recruiter@greenpathlabs.org", firstName: "Lena", lastName: "Danvers" },
    { email: "talent@ethicalcode.network", firstName: "Noah", lastName: "Ramirez" },
  ];

  const userIds: Record<string, string> = {};

  for (const entry of recruiterUsers) {
    const [existing] = await db.select().from(users).where(eq(users.email, entry.email));
    if (existing) {
      userIds[entry.email] = existing.id;
      continue;
    }
    const [created] = await db
      .insert(users)
      .values({
        email: entry.email,
        firstName: entry.firstName,
        lastName: entry.lastName,
        isApproved: true,
        isVerified: true,
      })
      .returning();
    userIds[entry.email] = created.id;
  }

  const profiles = [
    {
      userId: userIds["recruiter@greenpathlabs.org"],
      organizationName: "GreenPath Labs",
      recruiterName: "Lena Danvers",
      contactEmail: "recruiter@greenpathlabs.org",
      contactPhone: "+1-555-0198",
      focusIndustries: "Biotech lab ops, ethical research assistants",
      serviceRegions: "Remote (US/Canada), Onsite in Boston & Toronto",
      remoteExpertise: "Hybrid lab coordination & remote onboarding playbooks",
      candidateCapacity: 15,
      placementsCompleted: 47,
      isAcceptingCandidates: true,
      preferredRoles: "Research assistants, lab ops coordinators",
      languagesSupported: "English, French",
      verificationStatus: "approved",
    },
    {
      userId: userIds["talent@ethicalcode.network"],
      organizationName: "EthicalCode Network",
      recruiterName: "Noah Ramirez",
      contactEmail: "talent@ethicalcode.network",
      contactPhone: "+1-555-0119",
      focusIndustries: "Cybersecurity, civic tech, trauma-informed help desks",
      serviceRegions: "Remote-first with pop-ups in Seattle & Austin",
      remoteExpertise: "Distributed team onboarding & asynchronous mentorship",
      candidateCapacity: 22,
      placementsCompleted: 63,
      isAcceptingCandidates: true,
      preferredRoles: "Tier-1 support, ethical hacker apprentices",
      languagesSupported: "English, Spanish, Portuguese",
      verificationStatus: "approved",
    },
  ];

  for (const profile of profiles) {
    if (!profile.userId) continue;
    const [existing] = await db
      .select()
      .from(workforceRecruiterProfiles)
      .where(eq(workforceRecruiterProfiles.userId, profile.userId));
    if (existing) continue;
    await db.insert(workforceRecruiterProfiles).values(profile);
  }

  const [existingConfig] = await db.select().from(workforceRecruiterConfig).limit(1);
  if (!existingConfig) {
    await db.insert(workforceRecruiterConfig).values({
      missionStatement:
        "Center survivor safety while building hiring pipelines that never charge fees, avoid surveillance, and honor boundaries.",
      candidateEligibility:
        "Participants referred by support advocates, have safe communications channel, and opt-in to weekly check-ins.",
      employerExpectations:
        "Offer fair wages, emergency contact escalation paths, anonymous feedback loops, and zero probationary pay cuts.",
      escalationEmail: "workforce@the-comic.com",
      escalationPhone: "+1-415-555-2045",
      officeHours: "Tuesdays @ 15:00 UTC",
      supportChannel: "Signal concierge channel",
      priorityIndustries: "Ethical tech support, logistics, free clinics, safe rides",
    });
  }

  const occupations = [
    {
      title: "Trauma-Informed Help Desk Specialist",
      category: "Support",
      description:
        "Coordinate inbox triage for mission-aligned orgs. Requires active listening, note-taking discipline, and ability to escalate safely.",
      demandLevel: "high",
      openRoles: 12,
      priorityLevel: 5,
      remoteFriendly: true,
      requiresCertification: false,
      avgPlacementTimeDays: 21,
    },
    {
      title: "Ethical Fleet Dispatcher",
      category: "Logistics",
      description:
        "Plan safe transportation routes for mutual aid deliveries. Must understand geofencing and privacy-forward comms.",
      demandLevel: "moderate",
      openRoles: 7,
      priorityLevel: 4,
      remoteFriendly: true,
      requiresCertification: false,
      avgPlacementTimeDays: 28,
    },
    {
      title: "Clinical Research Coordinator (Supportive Lab)",
      category: "Healthcare",
      description:
        "Support low-risk lab projects focused on community health. Works onsite with recorded shift protections and peer advocates.",
      demandLevel: "low",
      openRoles: 3,
      priorityLevel: 2,
      remoteFriendly: false,
      requiresCertification: true,
      avgPlacementTimeDays: 35,
    },
  ];

  for (const occupation of occupations) {
    const [existing] = await db
      .select()
      .from(workforceRecruiterOccupations)
      .where(eq(workforceRecruiterOccupations.title, occupation.title));
    if (existing) continue;
    await db.insert(workforceRecruiterOccupations).values(occupation);
  }

  const announcements = [
    {
      title: "Q4 Hiring Sprint",
      content:
        "We are focusing on remote-friendly help desk cohorts this quarter. Ensure your profile capacity reflects true bandwidth.",
      type: "update",
    },
    {
      title: "Office Hours Shift",
      content:
        "The Workforce liaison team is shifting office hours to Wednesdays to accommodate APAC partners.",
      type: "info",
    },
  ];

  for (const announcement of announcements) {
    await db.insert(workforceRecruiterAnnouncements).values(announcement);
  }

  console.log("✅ Workforce Recruiter data seeded successfully");
}

seedWorkforceRecruiter()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding error:", error);
    process.exit(1);
  });

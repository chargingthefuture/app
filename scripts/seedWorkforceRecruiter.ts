import { db } from "../server/db";
import {
  workforceRecruiterConfig,
  workforceRecruiterOccupations,
  workforceRecruiterAnnouncements,
} from "../shared/schema";

async function seedWorkforceRecruiter() {
  console.log("🌱 Seeding Workforce Recruiter data...");

  const existingConfig = await db.select().from(workforceRecruiterConfig).limit(1);
  if (!existingConfig.length) {
    await db.insert(workforceRecruiterConfig).values({
      heroTitle: "Trauma-informed employment bridge",
      heroSubtitle:
        "Stabilize income with employers trained in survivors' safety plans, boundaries, and autonomy.",
      intakeStatus: "open",
      highlightOneLabel: "Active candidates",
      highlightOneValue: "18",
      highlightTwoLabel: "Employer partners",
      highlightTwoValue: "7",
      highlightThreeLabel: "Avg placement time",
      highlightThreeValue: "42 days",
      contactEmail: "workforce@psyopfree.org",
      contactPhone: "+1 (888) 000-0101",
      resourceLinkLabel: "Career prep kit",
      resourceLinkUrl: "https://psyopfree.org/resources/career-prep",
    });
    console.log("  • Added default config");
  } else {
    console.log("  • Config already present");
  }

  const occupationCount = await db
    .select({ count: workforceRecruiterOccupations.id })
    .from(workforceRecruiterOccupations);

  if (!occupationCount.length || Number(occupationCount[0].count) === 0) {
    const occupations = [
      {
        title: "Community resource navigator",
        sector: "Non-profit services",
        description: "Remote coordinator connecting survivors with housing, food, and mutual aid partners.",
        demandLevel: "high",
        salaryRange: "$24/hr – $28/hr",
        openings: 4,
        isRemoteFriendly: true,
        trainingProvided: true,
        priorityRank: 1,
      },
      {
        title: "Digital operations assistant",
        sector: "Social enterprise",
        description: "Hybrid operations support with flexible scheduling and trauma-aware supervisors.",
        demandLevel: "growing",
        salaryRange: "$22/hr – $26/hr",
        openings: 2,
        isRemoteFriendly: true,
        trainingProvided: false,
        priorityRank: 2,
      },
      {
        title: "Peer support facilitator",
        sector: "Mental health & wellness",
        description: "Part-time facilitation of virtual grounding circles with clinical backup available.",
        demandLevel: "stabilizing",
        salaryRange: "$30/hr – $34/hr",
        openings: 1,
        isRemoteFriendly: true,
        trainingProvided: true,
        priorityRank: 3,
      },
    ];
    await db.insert(workforceRecruiterOccupations).values(occupations);
    console.log(`  • Inserted ${occupations.length} occupations`);
  } else {
    console.log("  • Occupations already seeded");
  }

  const existingAnnouncements = await db
    .select({ count: workforceRecruiterAnnouncements.id })
    .from(workforceRecruiterAnnouncements);

  if (!existingAnnouncements.length || Number(existingAnnouncements[0].count) === 0) {
    await db.insert(workforceRecruiterAnnouncements).values([
      {
        title: "New harm-reduction employer onboarding",
        content: "Three new employer partners completed survivor-safety training. New roles open Monday.",
        type: "info",
        audience: "applicants",
        isActive: true,
      },
      {
        title: "Hiring pause for clinical advocates",
        content: "Clinical advocate roles are paused until May 15 while we refresh partner rosters.",
        type: "maintenance",
        audience: "all",
        isActive: true,
      },
    ]);
    console.log("  • Added sample announcements");
  } else {
    console.log("  • Announcements already seeded");
  }

  console.log("✅ Workforce Recruiter seeding complete");
}

seedWorkforceRecruiter()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error seeding Workforce Recruiter:", error);
    process.exit(1);
  });

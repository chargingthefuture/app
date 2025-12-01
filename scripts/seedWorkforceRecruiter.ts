import { db } from "../server/db";
import { workforceRecruiterOccupations } from "../shared/schema";
import { eq } from "drizzle-orm";

const occupations = [
  {
    slug: "trauma-informed-care-coordinator",
    title: "Trauma-Informed Care Coordinator",
    shortDescription: "Coordinate wrap-around employment support programs tailored for trafficking survivors entering the workforce.",
    fullDescription:
      "Works alongside survivor-led organizations to match clients with training, apprenticeships, and safe employers. The role emphasizes predictable schedules, rapid feedback loops, and accommodations for therapy or court appearances.",
    sector: "Social Services",
    category: "Care Coordination",
    employmentType: "full_time",
    experienceLevel: "mid",
    educationRequirement: "Associate degree or equivalent lived experience",
    salaryRangeMin: "52000.00",
    salaryRangeMax: "68000.00",
    currency: "USD",
    coreSkills: JSON.stringify(["Case management", "Motivational interviewing", "Documentation"]),
    preferredSkills: JSON.stringify(["Spanish language", "Peer mentorship"]),
    traumaInformedSupport: "Calm workspaces, virtual-first meetings, and flexible scheduling around therapy commitments.",
    remoteFriendly: true,
    requiresBackgroundCheck: false,
    offersApprenticeship: false,
    relocationSupport: false,
    applicationUrl: "https://example.org/jobs/trauma-informed-care-coordinator",
    priorityRank: 5,
    tags: JSON.stringify(["survivor-led", "remote-flexible", "wrap-around"]),
    resources: JSON.stringify(["https://example.org/resources/trauma-informed-care"]),
  },
  {
    slug: "digital-safety-analyst-apprentice",
    title: "Digital Safety Analyst Apprentice",
    shortDescription: "Paid apprenticeship focused on removing harmful content and mapping suspicious online recruitment tactics.",
    fullDescription:
      "Entry-level pathway with mentorship, rotating modules, and certification stipends. No previous tech experience required— training covers everything from secure browsing to writing survivor-safe escalation notes.",
    sector: "Technology",
    category: "Trust & Safety",
    employmentType: "apprenticeship",
    experienceLevel: "entry",
    educationRequirement: "High school diploma or GED",
    salaryRangeMin: "42000.00",
    salaryRangeMax: "50000.00",
    currency: "USD",
    coreSkills: JSON.stringify(["Attention to detail", "Pattern recognition"]),
    preferredSkills: JSON.stringify(["Community moderation", "OSINT basics"]),
    traumaInformedSupport:
      "Noise-cancelling gear provided, mandatory wellness breaks, and access to on-call counselors trained in trafficking-specific triggers.",
    remoteFriendly: true,
    offersApprenticeship: true,
    relocationSupport: false,
    applicationUrl: "https://example.org/jobs/digital-safety-analyst-apprentice",
    priorityRank: 12,
    tags: JSON.stringify(["entry-level", "paid-training", "trusted-employer"]),
    resources: JSON.stringify(["https://example.org/guide/digital-safety-careers"]),
  },
  {
    slug: "ethical-supply-field-auditor",
    title: "Ethical Supply Chain Field Auditor",
    shortDescription: "Travel to vetted partner sites to verify living wage, safe housing, and zero-retaliation policies.",
    fullDescription:
      "Short deployments (5-7 days) with decompression days, advance stipends, and optional travel buddy pairings. Ideal for individuals who enjoy hands-on work, interviewing, and advocating for safer labor practices.",
    sector: "Sustainable Manufacturing",
    category: "Compliance & Fieldwork",
    employmentType: "contract",
    experienceLevel: "mid",
    educationRequirement: "Experience in labor rights or investigative journalism preferred",
    salaryRangeMin: "60000.00",
    salaryRangeMax: "90000.00",
    currency: "USD",
    coreSkills: JSON.stringify(["Interviewing", "Report writing", "Risk assessment"]),
    preferredSkills: JSON.stringify(["French language", "Supply chain mapping"]),
    traumaInformedSupport:
      "Travel capped at two trips per quarter, peer check-ins every evening, and paid integration sessions upon return.",
    remoteFriendly: false,
    requiresBackgroundCheck: true,
    relocationSupport: true,
    applicationUrl: "https://example.org/jobs/ethical-supply-field-auditor",
    priorityRank: 18,
    tags: JSON.stringify(["travel", "advocacy", "fieldwork"]),
    resources: JSON.stringify(["https://example.org/resources/field-auditing"]),
  },
];

async function seedWorkforceRecruiter() {
  console.log("🌱 Seeding Workforce Recruiter occupations...");

  for (const occupation of occupations) {
    try {
      const [existing] = await db
        .select()
        .from(workforceRecruiterOccupations)
        .where(eq(workforceRecruiterOccupations.slug, occupation.slug));

      if (existing) {
        await db
          .update(workforceRecruiterOccupations)
          .set({
            ...occupation,
            updatedAt: new Date(),
          })
          .where(eq(workforceRecruiterOccupations.id, existing.id));
        console.log(`↺ Updated occupation: ${occupation.title}`);
      } else {
        await db.insert(workforceRecruiterOccupations).values(occupation);
        console.log(`✓ Created occupation: ${occupation.title}`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to seed ${occupation.title}:`, error.message || error);
    }
  }

  console.log("✅ Workforce Recruiter occupations seeded successfully");
}

seedWorkforceRecruiter()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding error:", error);
    process.exit(1);
  });

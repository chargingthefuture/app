import { db } from "../server/db";
import { workforceRecruiterOccupations, skillsJobTitles } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Migration script to add jobTitleId to existing workforce recruiter occupations
 * 
 * This script:
 * 1. Adds the job_title_id column if it doesn't exist (via ALTER TABLE)
 * 2. Backfills jobTitleId for existing occupations by matching occupation_title to job title name
 * 
 * Run this after updating the schema to ensure existing occupations can match skills properly.
 */
async function migrateWorkforceRecruiterJobTitleId() {
  console.log("Starting migration: Add jobTitleId to workforce_recruiter_occupations...");

  try {
    // Step 1: Add column if it doesn't exist (idempotent)
    console.log("Step 1: Adding job_title_id column if it doesn't exist...");
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'workforce_recruiter_occupations' 
          AND column_name = 'job_title_id'
        ) THEN
          ALTER TABLE workforce_recruiter_occupations 
          ADD COLUMN job_title_id VARCHAR REFERENCES skills_job_titles(id);
          
          RAISE NOTICE '✅ Added job_title_id column to workforce_recruiter_occupations table';
        ELSE
          RAISE NOTICE 'ℹ️  job_title_id column already exists in workforce_recruiter_occupations table';
        END IF;
      END $$;
    `);
    console.log("✅ Column check complete");

    // Step 2: Get all occupations without jobTitleId
    console.log("Step 2: Finding occupations without jobTitleId...");
    const occupations = await db
      .select()
      .from(workforceRecruiterOccupations)
      .where(sql`${workforceRecruiterOccupations.jobTitleId} IS NULL`);

    console.log(`Found ${occupations.length} occupations without jobTitleId`);

    if (occupations.length === 0) {
      console.log("✅ All occupations already have jobTitleId. Migration complete.");
      return;
    }

    // Step 3: Get all job titles for matching
    const allJobTitles = await db.select().from(skillsJobTitles);
    const jobTitleNameToIdMap = new Map<string, string>();
    for (const jobTitle of allJobTitles) {
      const normalizedName = jobTitle.name.toLowerCase().trim();
      jobTitleNameToIdMap.set(normalizedName, jobTitle.id);
    }

    console.log(`Loaded ${allJobTitles.length} job titles for matching`);

    // Step 4: Backfill jobTitleId by matching occupation_title to job title name
    let updated = 0;
    let notFound = 0;

    for (const occ of occupations) {
      const normalizedOccTitle = occ.occupationTitle.toLowerCase().trim();
      const jobTitleId = jobTitleNameToIdMap.get(normalizedOccTitle);

      if (jobTitleId) {
        await db
          .update(workforceRecruiterOccupations)
          .set({ jobTitleId })
          .where(eq(workforceRecruiterOccupations.id, occ.id));
        updated++;
        console.log(`  ✅ Updated: ${occ.occupationTitle} -> jobTitleId: ${jobTitleId}`);
      } else {
        notFound++;
        console.log(`  ⚠️  No matching job title found for: ${occ.occupationTitle}`);
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`  ✅ Updated: ${updated} occupations`);
    console.log(`  ⚠️  Not found: ${notFound} occupations (will use fallback matching)`);
    console.log("\n✅ Migration complete!");

  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateWorkforceRecruiterJobTitleId()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateWorkforceRecruiterJobTitleId };


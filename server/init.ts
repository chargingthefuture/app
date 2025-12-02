import { storage } from "./storage";
import { pool } from "./db";

async function initializeDefaultPricingTier() {
  try {
    // Check if a current pricing tier exists
    const currentTier = await storage.getCurrentPricingTier();
    
    if (!currentTier) {
      await storage.createPricingTier({
        amount: '1.00',
        effectiveDate: new Date(),
        isCurrentTier: true,
      });
    }
  } catch (error) {
    console.error("Error initializing pricing tier:", error);
  }
}

async function ensureSocketrelayIsPublicColumn() {
  try {
    const { rows } = await pool.query<{ column_name: string }>(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'socketrelay_requests'
          AND column_name IN ('isPublic', 'is_public')
      `,
    );

    const hasCamelCase = rows.some((row) => row.column_name === "isPublic");
    const hasSnakeCase = rows.some((row) => row.column_name === "is_public");

    if (hasCamelCase) {
      return;
    }

    if (hasSnakeCase) {
      await pool.query(`ALTER TABLE socketrelay_requests RENAME COLUMN "is_public" TO "isPublic";`);
    } else {
      await pool.query(`ALTER TABLE socketrelay_requests ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;`);
    }

    // Make sure defaults and nullability are correct even after a rename
    await pool.query(`UPDATE socketrelay_requests SET "isPublic" = false WHERE "isPublic" IS NULL;`);
    await pool.query(`ALTER TABLE socketrelay_requests ALTER COLUMN "isPublic" SET DEFAULT false;`);
    await pool.query(`ALTER TABLE socketrelay_requests ALTER COLUMN "isPublic" SET NOT NULL;`);

    console.log("[init] Ensured socketrelay_requests.isPublic column exists with defaults");
  } catch (error) {
    console.error("[init] Failed to ensure socketrelay_requests.isPublic column:", error);
  }
}

// Run initialization tasks
initializeDefaultPricingTier();
ensureSocketrelayIsPublicColumn();

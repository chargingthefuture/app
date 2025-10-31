import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sqlClient = neon(process.env.DATABASE_URL);

/**
 * Fix the socketrelay_requests table column name
 * Drizzle is confused because the table might have "isPublic" instead of "is_public"
 */
async function fixSocketRelayColumn() {
  try {
    console.log("Checking socketrelay_requests table structure...");
    
    // Check if isPublic column exists (camelCase)
    const camelCaseResult = await sqlClient`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'socketrelay_requests' 
      AND column_name = 'isPublic'
    `;
    
    // Check if is_public column exists (snake_case)
    const snakeCaseResult = await sqlClient`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'socketrelay_requests' 
      AND column_name = 'is_public'
    `;
    
    const camelCaseExists = camelCaseResult.length > 0;
    const snakeCaseExists = snakeCaseResult.length > 0;
    
    console.log("CamelCase column exists:", camelCaseExists);
    console.log("SnakeCase column exists:", snakeCaseExists);
    
    // If camelCase exists but snakeCase doesn't, rename it
    if (camelCaseExists && !snakeCaseExists) {
      console.log("Renaming 'isPublic' to 'is_public'...");
      await sqlClient`ALTER TABLE socketrelay_requests RENAME COLUMN "isPublic" TO "is_public"`;
      console.log("✅ Column renamed successfully!");
    } else if (camelCaseExists && snakeCaseExists) {
      console.log("⚠️  Both columns exist! Dropping camelCase column...");
      // If both exist, drop the camelCase one (assuming snakeCase has the correct data)
      await sqlClient`ALTER TABLE socketrelay_requests DROP COLUMN "isPublic"`;
      console.log("✅ Removed duplicate camelCase column!");
    } else if (!snakeCaseExists && !camelCaseExists) {
      console.log("Neither column exists. Creating is_public column...");
      await sqlClient`ALTER TABLE socketrelay_requests ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false`;
      console.log("✅ Column created successfully!");
    } else {
      console.log("✅ Column structure is correct!");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing column:", error);
    process.exit(1);
  }
}

fixSocketRelayColumn();


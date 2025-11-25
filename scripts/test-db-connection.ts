/**
 * Database Connection Test Script
 * 
 * This script tests the database connection and basic queries
 * to help diagnose production issues.
 * 
 * Usage: tsx scripts/test-db-connection.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { db } from "../server/db";
import { users, pricingTiers } from "@shared/schema";
import { sql } from "drizzle-orm";

async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...\n");

  try {
    // Test 1: Basic connection
    console.log("Test 1: Basic connection test");
    await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Connection successful\n");

    // Test 2: Check if users table exists and is accessible
    console.log("Test 2: Check users table");
    const userCount = await db.select().from(users).limit(1);
    console.log("✅ Users table accessible\n");

    // Test 3: Check if pricing_tiers table exists and is accessible
    console.log("Test 3: Check pricing_tiers table");
    const tierCount = await db.select().from(pricingTiers).limit(1);
    console.log("✅ Pricing tiers table accessible\n");

    // Test 4: Check table structure
    console.log("Test 4: Check users table structure");
    const userColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log("Users table columns:");
    console.table(userColumns.rows);
    console.log("");

    // Test 5: Check for missing indexes
    console.log("Test 5: Check indexes on users table");
    const indexes = await db.execute(sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'users'
    `);
    console.log("Indexes on users table:");
    console.table(indexes.rows);
    console.log("");

    // Test 6: Test a query that the server uses on startup
    console.log("Test 6: Test getCurrentPricingTier query");
    const currentTier = await db.execute(sql`
      SELECT * FROM pricing_tiers
      WHERE is_current_tier = true
      ORDER BY effective_date DESC
      LIMIT 1
    `);
    console.log("✅ getCurrentPricingTier query successful");
    console.log(`Found ${currentTier.rows.length} current tier(s)\n`);

    // Test 7: Check for common missing tables
    console.log("Test 7: Check for required tables");
    const requiredTables = [
      'users',
      'pricing_tiers',
      'payments',
      'admin_action_logs',
      'sessions',
      'support_match_profiles',
      'lighthouse_profiles',
      'socketrelay_profiles',
      'directory_profiles',
      'trusttransport_profiles',
      'mechanicmatch_profiles',
    ];

    const tableCheck = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    const existingTables = tableCheck.rows.map((row: any) => row.table_name);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    if (missingTables.length > 0) {
      console.log("❌ Missing tables:");
      missingTables.forEach(t => console.log(`  - ${t}`));
    } else {
      console.log("✅ All required tables exist");
    }
    console.log("");

    console.log("✅ All tests passed!");
    process.exit(0);

  } catch (error: any) {
    console.error("❌ Database test failed!");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error detail:", error.detail);
    console.error("Error constraint:", error.constraint);
    console.error("\nFull error:");
    console.error(error);
    process.exit(1);
  }
}

testDatabaseConnection();


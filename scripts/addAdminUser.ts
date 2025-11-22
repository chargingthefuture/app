import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script to add or update a user as admin
 * 
 * Usage:
 *   tsx scripts/addAdminUser.ts <clerk-user-id> [email] [firstName] [lastName]
 * 
 * Examples:
 *   tsx scripts/addAdminUser.ts user_2abc123def
 *   tsx scripts/addAdminUser.ts user_2abc123def admin@example.com "Admin" "User"
 */

async function addAdminUser() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error("Usage: tsx scripts/addAdminUser.ts <clerk-user-id> [email] [firstName] [lastName]");
    console.error("\nExample:");
    console.error("  tsx scripts/addAdminUser.ts user_2abc123def");
    console.error("  tsx scripts/addAdminUser.ts user_2abc123def admin@example.com \"Admin\" \"User\"");
    process.exit(1);
  }

  const clerkUserId = args[0];
  const email = args[1] || null;
  const firstName = args[2] || null;
  const lastName = args[3] || null;

  console.log(`\nAdding/updating admin user...`);
  console.log(`  Clerk User ID: ${clerkUserId}`);
  if (email) console.log(`  Email: ${email}`);
  if (firstName) console.log(`  First Name: ${firstName}`);
  if (lastName) console.log(`  Last Name: ${lastName}`);
  console.log();

  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, clerkUserId))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      console.log(`User with ID ${clerkUserId} already exists. Updating to admin...`);
      
      const [updatedUser] = await db
        .update(users)
        .set({
          isAdmin: true,
          inviteCodeUsed: "ADMIN-SETUP", // Set invite code so they bypass invite requirement
          ...(email && { email }),
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, clerkUserId))
        .returning();

      console.log("\n✅ User updated successfully!");
      console.log(`   ID: ${updatedUser.id}`);
      console.log(`   Email: ${updatedUser.email || 'N/A'}`);
      console.log(`   Name: ${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || 'N/A');
      console.log(`   Is Admin: ${updatedUser.isAdmin}`);
      console.log(`   Invite Code Used: ${updatedUser.inviteCodeUsed || 'N/A'}`);
    } else {
      // Create new user
      console.log(`Creating new admin user...`);
      
      if (!email) {
        console.error("\n❌ Error: Email is required when creating a new user.");
        console.error("   Please provide email as second argument.");
        process.exit(1);
      }

      // Get current pricing tier
      const { storage } = await import("../server/storage");
      const currentTier = await storage.getCurrentPricingTier();
      const pricingTier = currentTier?.amount || '1.00';

      const [newUser] = await db
        .insert(users)
        .values({
          id: clerkUserId,
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          isAdmin: true,
          inviteCodeUsed: "ADMIN-SETUP", // Set invite code so they bypass invite requirement
          pricingTier,
        })
        .returning();

      console.log("\n✅ User created successfully!");
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Name: ${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || 'N/A');
      console.log(`   Is Admin: ${newUser.isAdmin}`);
      console.log(`   Invite Code Used: ${newUser.inviteCodeUsed}`);
    }

    console.log("\n🎉 Admin user setup complete!");
    console.log("   The user can now log in and will have admin access.");
    console.log("   They will bypass the invite code requirement.\n");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error adding admin user:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  }
}

addAdminUser();



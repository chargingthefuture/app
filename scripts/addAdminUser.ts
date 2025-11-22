import { db } from "../server/db";
import { users, inviteCodes } from "../shared/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

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

    let targetUser;
    
    if (existingUser.length > 0) {
      // Update existing user to admin first (so we can use their ID for invite code creation)
      console.log(`User with ID ${clerkUserId} already exists. Updating to admin...`);
      
      const [updatedUser] = await db
        .update(users)
        .set({
          isAdmin: true,
          ...(email && { email }),
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, clerkUserId))
        .returning();
      
      targetUser = updatedUser;
    } else {
      // Create new user first (so we can use their ID for invite code creation)
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
          pricingTier,
        })
        .returning();
      
      targetUser = newUser;
    }

    // Generate a valid 12-character invite code (6 bytes = 12 hex characters)
    const adminInviteCode = randomBytes(6).toString('hex').toUpperCase();
    
    // Check if invite code already exists (unlikely but possible)
    const existingInvite = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, adminInviteCode))
      .limit(1);
    
    if (existingInvite.length > 0) {
      console.log(`⚠️  Invite code ${adminInviteCode} already exists. Using it...`);
      // Update user with existing invite code
      await db
        .update(users)
        .set({
          inviteCodeUsed: adminInviteCode,
          updatedAt: new Date(),
        })
        .where(eq(users.id, clerkUserId));
      
      // Increment usage count
      await db
        .update(inviteCodes)
        .set({
          currentUses: existingInvite[0].currentUses + 1,
          updatedAt: new Date(),
        })
        .where(eq(inviteCodes.id, existingInvite[0].id));
    } else {
      // Create a new invite code for the admin user
      console.log(`Creating admin invite code: ${adminInviteCode}`);
      
      await db
        .insert(inviteCodes)
        .values({
          code: adminInviteCode,
          maxUses: 1,
          currentUses: 1,
          createdBy: clerkUserId,
          isActive: true,
        });
      
      // Update user with the invite code
      await db
        .update(users)
        .set({
          inviteCodeUsed: adminInviteCode,
          updatedAt: new Date(),
        })
        .where(eq(users.id, clerkUserId));
    }

    // Fetch the final user state
    const [finalUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, clerkUserId))
      .limit(1);

    console.log("\n✅ User updated successfully!");
    console.log(`   ID: ${finalUser.id}`);
    console.log(`   Email: ${finalUser.email || 'N/A'}`);
    console.log(`   Name: ${finalUser.firstName || ''} ${finalUser.lastName || ''}`.trim() || 'N/A');
    console.log(`   Is Admin: ${finalUser.isAdmin}`);
    console.log(`   Invite Code Used: ${finalUser.inviteCodeUsed || 'N/A'}`);

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



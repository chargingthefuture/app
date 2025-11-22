import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Simple one-off script to make a user admin by email address
 * 
 * Usage:
 *   tsx scripts/makeAdmin.ts
 * 
 * This script will:
 * 1. Find the user with email jelly-jab-unloved@duck.com
 * 2. Set them as admin
 * 3. Approve them for app access
 */

const ADMIN_EMAIL = "jelly-jab-unloved@duck.com";

async function makeAdmin() {
  console.log(`\nMaking ${ADMIN_EMAIL} an admin...\n`);

  try {
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL))
      .limit(1);

    if (!user) {
      console.error(`❌ Error: User with email ${ADMIN_EMAIL} not found.`);
      console.error("   Please make sure the user has signed in at least once.");
      process.exit(1);
    }

    console.log(`Found user:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A');
    console.log(`   Current Admin Status: ${user.isAdmin}`);

    // Check if user is deleted
    if (user.email === null && user.firstName === "Deleted" && user.lastName === "User") {
      console.error(`\n❌ Error: This user account has been deleted.`);
      console.error("   Please contact support to restore the account first.");
      process.exit(1);
    }

    // Update user with admin status and approval
    await db
      .update(users)
      .set({
        isAdmin: true,
        isApproved: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Fetch the final user state
    const [finalUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    console.log("\n✅ User updated successfully!");
    console.log(`   ID: ${finalUser.id}`);
    console.log(`   Email: ${finalUser.email}`);
    console.log(`   Name: ${finalUser.firstName || ''} ${finalUser.lastName || ''}`.trim() || 'N/A');
    console.log(`   Is Admin: ${finalUser.isAdmin}`);
    console.log(`   Is Approved: ${finalUser.isApproved}`);

    console.log("\n🎉 Admin user setup complete!");
    console.log("   The user can now log in and will have admin access.");
    console.log("   They have been approved for app access.\n");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error making user admin:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  }
}

makeAdmin();


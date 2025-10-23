import { storage } from "./storage";

async function makeFirstUserAdmin() {
  try {
    const users = await storage.getAllUsers();
    
    if (users.length === 0) {
      console.log("No users found. Log in first to create your account.");
      return;
    }

    const firstUser = users[users.length - 1]; // Most recent user
    
    if (firstUser.isAdmin) {
      console.log(`User ${firstUser.email} is already an admin.`);
      return;
    }

    await storage.upsertUser({
      ...firstUser,
      isAdmin: true,
    });

    console.log(`✓ User ${firstUser.email} has been made an admin.`);
  } catch (error) {
    console.error("Error making user admin:", error);
  }
}

makeFirstUserAdmin();

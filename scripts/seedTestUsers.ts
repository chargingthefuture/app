import { db } from "../server/db";
import { users, supportMatchProfiles } from "../shared/schema";

async function seedTestUsers() {
  console.log("Creating test users and profiles...");

  // Create test users and their SupportMatch profiles
  const testData = [
    {
      email: "alice@example.com",
      firstName: "Alice",
      lastName: "Smith",
      nickname: "Alice",
      gender: "female",
      genderPreference: "any",
      timezone: "America/New_York",
    },
    {
      email: "bob@example.com",
      firstName: "Bob",
      lastName: "Johnson",
      nickname: "Bob",
      gender: "male",
      genderPreference: "male",
      timezone: "America/New_York",
    },
    {
      email: "carol@example.com",
      firstName: "Carol",
      lastName: "Williams",
      nickname: "Carol",
      gender: "female",
      genderPreference: "female",
      timezone: "America/Los_Angeles",
    },
    {
      email: "david@example.com",
      firstName: "David",
      lastName: "Brown",
      nickname: "David",
      gender: "male",
      genderPreference: "any",
      timezone: "America/New_York",
    },
    {
      email: "emma@example.com",
      firstName: "Emma",
      lastName: "Davis",
      nickname: "Emma",
      gender: "female",
      genderPreference: "any",
      timezone: "America/Chicago",
    },
    {
      email: "frank@example.com",
      firstName: "Frank",
      lastName: "Miller",
      nickname: "Frank",
      gender: "male",
      genderPreference: "male",
      timezone: "America/Chicago",
    },
  ];

  for (const data of testData) {
    try {
      // Create user
      const [user] = await db
        .insert(users)
        .values({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          inviteCodeUsed: "TEST-SEED-2025",
          isAdmin: false,
        })
        .returning();

      console.log(`Created user: ${data.email}`);

      // Create SupportMatch profile
      await db.insert(supportMatchProfiles).values({
        userId: user.id,
        nickname: data.nickname,
        gender: data.gender,
        genderPreference: data.genderPreference,
        timezone: data.timezone,
        isActive: true,
      });

      console.log(`Created profile for: ${data.nickname}`);
    } catch (error) {
      console.log(`User ${data.email} may already exist, skipping...`);
    }
  }

  console.log("\nTest users created successfully!");
  console.log("\nExpected matches when you run the algorithm:");
  console.log("- Alice (female, any) + David (male, any) - Same timezone (NY)");
  console.log("- Bob (male, prefers male) + Frank (male, prefers male) - Compatible preferences");
  console.log("- Carol (female, prefers female) - May not match (needs another female who prefers female)");
  console.log("- Emma (female, any) - May match with Carol or be unmatched");
  
  process.exit(0);
}

seedTestUsers().catch((error) => {
  console.error("Error seeding test users:", error);
  process.exit(1);
});

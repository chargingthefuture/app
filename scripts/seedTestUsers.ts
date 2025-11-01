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
    {
      email: "grace@example.com",
      firstName: "Grace",
      lastName: "Taylor",
      nickname: "Grace",
      gender: "female",
      genderPreference: "female",
      timezone: "America/New_York",
    },
    {
      email: "henry@example.com",
      firstName: "Henry",
      lastName: "Anderson",
      nickname: "Henry",
      gender: "male",
      genderPreference: "any",
      timezone: "America/Los_Angeles",
    },
    {
      email: "isabel@example.com",
      firstName: "Isabel",
      lastName: "Martinez",
      nickname: "Isabel",
      gender: "female",
      genderPreference: "any",
      timezone: "America/New_York",
    },
    {
      email: "jack@example.com",
      firstName: "Jack",
      lastName: "Robinson",
      nickname: "Jack",
      gender: "male",
      genderPreference: "male",
      timezone: "America/Los_Angeles",
    },
    {
      email: "kate@example.com",
      firstName: "Kate",
      lastName: "Wilson",
      nickname: "Kate",
      gender: "female",
      genderPreference: "female",
      timezone: "America/Chicago",
    },
    {
      email: "leo@example.com",
      firstName: "Leo",
      lastName: "Thompson",
      nickname: "Leo",
      gender: "male",
      genderPreference: "any",
      timezone: "America/Chicago",
    },
    {
      email: "maya@example.com",
      firstName: "Maya",
      lastName: "Garcia",
      nickname: "Maya",
      gender: "female",
      genderPreference: "any",
      timezone: "America/Los_Angeles",
    },
    {
      email: "noah@example.com",
      firstName: "Noah",
      lastName: "Lee",
      nickname: "Noah",
      gender: "male",
      genderPreference: "male",
      timezone: "America/New_York",
    },
    {
      email: "olivia@example.com",
      firstName: "Olivia",
      lastName: "Harris",
      nickname: "Olivia",
      gender: "female",
      genderPreference: "female",
      timezone: "America/Los_Angeles",
    },
    {
      email: "paul@example.com",
      firstName: "Paul",
      lastName: "Clark",
      nickname: "Paul",
      gender: "male",
      genderPreference: "any",
      timezone: "America/Denver",
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
        timezonePreference: "same_timezone", // Default preference
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
  console.log("- Bob (male, prefers male) + Noah (male, prefers male) - Same timezone (NY)");
  console.log("- Carol (female, prefers female) + Olivia (female, prefers female) - Same timezone (LA)");
  console.log("- Emma (female, any) + Leo (male, any) - Same timezone (Chicago)");
  console.log("- Frank (male, prefers male) + Jack (male, prefers male) - Compatible preferences");
  console.log("- Grace (female, prefers female) + Kate (female, prefers female) - Compatible preferences");
  console.log("- Henry (male, any) + Maya (female, any) - Same timezone (LA)");
  console.log("- Isabel (female, any) + Paul (male, any) - Compatible preferences");
  console.log("\nTotal: 16 test users with diverse profiles for algorithm testing");
  
  process.exit(0);
}

seedTestUsers().catch((error) => {
  console.error("Error seeding test users:", error);
  process.exit(1);
});

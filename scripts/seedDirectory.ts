import { db } from "../server/db";
import { directoryProfiles, users, type InsertDirectoryProfile } from "../shared/schema";

async function seedDirectory() {
  console.log("Seeding Directory app profiles...");

  const countries = [
    "United States","United Kingdom","Canada","Australia","Germany","France","India","Brazil","Japan","Kenya"
  ];
  const skillsPool = [
    "Cooking","Tutoring","Childcare","Counseling","Job Search Help","Resume Writing","Ride Sharing","Language Exchange","Art & Crafts","Tech Support"
  ];

  const pickSkills = () => {
    const shuffled = [...skillsPool].sort(() => Math.random() - 0.5);
    const n = 1 + Math.floor(Math.random() * 3);
    return shuffled.slice(0, n);
  };

  // Optionally attach some profiles to existing users to exercise first-name display
  const existingUsers = await db.select().from(users).limit(20);

  const count = 16;
  for (let i = 0; i < count; i++) {
    try {
      const maybeUser = existingUsers[i % Math.max(existingUsers.length, 1)];
      const attachToUser = !!maybeUser && Math.random() < 0.5;

      const payload: InsertDirectoryProfile = {
        // userId optional to allow unclaimed
        userId: attachToUser ? maybeUser.id : undefined,
        description: `Available for ${Math.random() < 0.5 ? 'helping' : 'learning'} (${i + 1})`,
        skills: pickSkills(),
        signalUrl: null,
        quoraUrl: null,
        city: null,
        state: null,
        country: countries[Math.floor(Math.random() * countries.length)],
        isPublic: Math.random() < 0.8,
        isVerified: Math.random() < 0.4,
        // isClaimed is automatically set based on userId presence
        // naming
        nickname: Math.random() < 0.6 ? `Helper ${i + 1}` : null,
        displayNameType: Math.random() < 0.5 ? 'nickname' : 'first',
      };

      await db.insert(directoryProfiles).values(payload);
    } catch (error) {
      console.log(`Row ${i + 1} may already exist, skipping...`);
    }
  }

  console.log("Directory seed complete.");
  process.exit(0);
}

seedDirectory().catch((error) => {
  console.error("Error seeding Directory:", error);
  process.exit(1);
});



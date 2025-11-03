import { db } from "../server/db";
import { chatGroups, type InsertChatGroup } from "../shared/schema";

async function seedChatGroups() {
  console.log("Seeding Chat Groups...");

  const groups: InsertChatGroup[] = [
    {
      name: "General Support",
      signalUrl: "https://signal.group/#CjQKIO6X...",
      description: "A general support group for all survivors to connect and share resources.",
      displayOrder: 1,
      isActive: true,
    },
    {
      name: "Local NYC Meetups",
      signalUrl: "https://signal.group/#CjQKIO6Y...",
      description: "Coordinate local meetups and events in New York City area.",
      displayOrder: 2,
      isActive: true,
    },
    {
      name: "Job Opportunities",
      signalUrl: "https://signal.group/#CjQKIO6Z...",
      description: "Share job postings, resume tips, and career support.",
      displayOrder: 3,
      isActive: true,
    },
  ];

  for (const groupData of groups) {
    try {
      await db.insert(chatGroups).values(groupData);
      console.log(`Created chat group: ${groupData.name}`);
    } catch (error) {
      console.log(`Chat group ${groupData.name} may already exist, skipping...`);
    }
  }

  console.log("Chat Groups seed complete.");
  process.exit(0);
}

seedChatGroups().catch((error) => {
  console.error("Error seeding Chat Groups:", error);
  process.exit(1);
});


import { db } from "../server/db";
import { chatGroups, chatgroupsAnnouncements, type InsertChatGroup, type InsertChatgroupsAnnouncement } from "../shared/schema";

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

  // Seed ChatGroups announcements
  const announcementsData: InsertChatgroupsAnnouncement[] = [
    {
      title: "Welcome to Chat Groups",
      content: "Connect with other survivors in real-time through Signal groups. All groups are moderated and designed to provide safe, supportive spaces for community building.",
      type: "info",
      isActive: true,
      expiresAt: null,
    },
    {
      title: "Group Guidelines",
      content: "Please be respectful and trauma-informed in all group communications. Remember that everyone here is on their own healing journey. Harassment or inappropriate behavior will not be tolerated.",
      type: "info",
      isActive: true,
      expiresAt: null,
    },
    {
      title: "New Groups Available",
      content: "We've added new groups for job opportunities and local meetups. Check out the updated list of available groups!",
      type: "update",
      isActive: true,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
  ];

  for (const announcementData of announcementsData) {
    try {
      await db.insert(chatgroupsAnnouncements).values(announcementData);
      console.log(`Created ChatGroups announcement: ${announcementData.title}`);
    } catch (error) {
      console.log(`Error creating announcement "${announcementData.title}":`, error);
    }
  }

  console.log("Chat Groups seed complete.");
  process.exit(0);
}

seedChatGroups().catch((error) => {
  console.error("Error seeding Chat Groups:", error);
  process.exit(1);
});


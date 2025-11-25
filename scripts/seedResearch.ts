import { db } from "../server/db";
import {
  users,
  researchItems,
  researchAnswers,
  researchComments,
  researchVotes,
  researchBookmarks,
  researchAnnouncements,
  type InsertResearchItem,
  type InsertResearchAnswer,
  type InsertResearchComment,
  type InsertResearchVote,
  type InsertResearchBookmark,
  type InsertResearchAnnouncement,
} from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedResearch() {
  console.log("Creating Research seed data...");

  // Create test users for Research
  const testUsers = [
    { email: "researcher1@example.com", firstName: "Alex", lastName: "Martinez" },
    { email: "researcher2@example.com", firstName: "Jordan", lastName: "Kim" },
    { email: "researcher3@example.com", firstName: "Taylor", lastName: "Brown" },
    { email: "researcher4@example.com", firstName: "Morgan", lastName: "Davis" },
  ];

  const userIds: Record<string, string> = {};

  for (const userData of testUsers) {
    try {
      const [user] = await db
        .insert(users)
        .values({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isApproved: true,
          isAdmin: false,
        })
        .returning();

      userIds[userData.email] = user.id;
      console.log(`Created user: ${userData.email}`);
    } catch (error) {
      // User might already exist, try to get their ID
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));

      if (existingUser) {
        userIds[userData.email] = existingUser.id;
        console.log(`User ${userData.email} already exists, using existing ID`);
      }
    }
  }

  // Create research items (questions/posts)
  const researchItemsData: InsertResearchItem[] = [
    {
      userId: userIds["researcher1@example.com"],
      title: "What are the best trauma-informed therapy approaches for survivors?",
      bodyMd: "I'm researching different therapy approaches that are specifically designed for trauma survivors. What has worked best in your experience?",
      tags: JSON.stringify(["therapy", "trauma", "healing"]),
      attachments: null,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isPublic: true,
      status: "open",
      viewCount: 15,
    },
    {
      userId: userIds["researcher2@example.com"],
      title: "Resources for finding safe housing after leaving a trafficking situation",
      bodyMd: "Looking for comprehensive resources and organizations that help survivors find safe, affordable housing. Any recommendations?",
      tags: JSON.stringify(["housing", "resources", "safety"]),
      attachments: null,
      deadline: null,
      isPublic: true,
      status: "in_progress",
      viewCount: 32,
    },
    {
      userId: userIds["researcher3@example.com"],
      title: "Legal rights and protections for survivors",
      bodyMd: "What legal protections are available to survivors? I'm particularly interested in employment rights and housing discrimination protections.",
      tags: JSON.stringify(["legal", "rights", "protection"]),
      attachments: null,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      isPublic: true,
      status: "open",
      viewCount: 8,
    },
    {
      userId: userIds["researcher1@example.com"],
      title: "Support groups and community resources",
      bodyMd: "Where can survivors find supportive communities and peer support groups? Both online and in-person options.",
      tags: JSON.stringify(["community", "support", "peer-support"]),
      attachments: null,
      deadline: null,
      isPublic: false,
      status: "answered",
      viewCount: 5,
    },
  ];

  const createdItems: any[] = [];

  for (const itemData of researchItemsData) {
    try {
      const [item] = await db
        .insert(researchItems)
        .values(itemData)
        .returning();
      createdItems.push(item);
      console.log(`Created research item: ${itemData.title.substring(0, 50)}...`);
    } catch (error) {
      console.log(`Error creating research item:`, error);
    }
  }

  // Create answers for research items
  const answersData: InsertResearchAnswer[] = [
    {
      researchItemId: createdItems[0].id,
      userId: userIds["researcher2@example.com"],
      bodyMd: "EMDR (Eye Movement Desensitization and Reprocessing) has been very effective for many survivors. It's specifically designed for trauma processing.",
      links: JSON.stringify(["https://www.emdria.org/"]),
      attachments: null,
      confidenceScore: 85,
      score: 5,
      isAccepted: false,
    },
    {
      researchItemId: createdItems[0].id,
      userId: userIds["researcher3@example.com"],
      bodyMd: "Somatic experiencing and body-based therapies are also excellent. Trauma is stored in the body, so addressing physical sensations is crucial.",
      links: JSON.stringify(["https://traumahealing.org/"]),
      attachments: null,
      confidenceScore: 80,
      score: 3,
      isAccepted: true,
    },
    {
      researchItemId: createdItems[1].id,
      userId: userIds["researcher4@example.com"],
      bodyMd: "The National Human Trafficking Hotline has a directory of housing resources. Also check with local survivor-led organizations in your area.",
      links: JSON.stringify(["https://humantraffickinghotline.org/"]),
      attachments: null,
      confidenceScore: 90,
      score: 7,
      isAccepted: false,
    },
    {
      researchItemId: createdItems[3].id,
      userId: userIds["researcher2@example.com"],
      bodyMd: "There are several online communities and forums specifically for survivors. Many cities also have in-person support groups through local organizations.",
      links: null,
      attachments: null,
      confidenceScore: 75,
      score: 2,
      isAccepted: false,
    },
  ];

  const createdAnswers: any[] = [];

  for (const answerData of answersData) {
    try {
      const [answer] = await db
        .insert(researchAnswers)
        .values(answerData)
        .returning();
      createdAnswers.push(answer);
      console.log(`Created answer for research item ${answerData.researchItemId}`);
    } catch (error) {
      console.log(`Error creating answer:`, error);
    }
  }

  // Create comments
  const commentsData: InsertResearchComment[] = [
    {
      researchItemId: createdItems[0].id,
      userId: userIds["researcher4@example.com"],
      bodyMd: "Great question! I've also found group therapy helpful for building community.",
      parentCommentId: null,
    },
    {
      researchItemId: createdItems[1].id,
      userId: userIds["researcher1@example.com"],
      bodyMd: "Thank you for this resource! I'll check it out.",
      parentCommentId: null,
    },
  ];

  for (const commentData of commentsData) {
    try {
      await db.insert(researchComments).values(commentData);
      console.log(`Created comment for research item ${commentData.researchItemId}`);
    } catch (error) {
      console.log(`Error creating comment:`, error);
    }
  }

  // Create votes (value: 1 for upvote, -1 for downvote)
  const votesData: InsertResearchVote[] = [
    {
      researchItemId: createdItems[0].id,
      userId: userIds["researcher4@example.com"],
      value: 1,
    },
    {
      researchItemId: createdItems[0].id,
      userId: userIds["researcher3@example.com"],
      value: 1,
    },
    {
      answerId: createdAnswers[0].id,
      userId: userIds["researcher1@example.com"],
      value: 1,
    },
    {
      answerId: createdAnswers[0].id,
      userId: userIds["researcher4@example.com"],
      value: 1,
    },
    {
      answerId: createdAnswers[1].id,
      userId: userIds["researcher1@example.com"],
      value: 1,
    },
  ];

  for (const voteData of votesData) {
    try {
      await db.insert(researchVotes).values(voteData);
      console.log(`Created vote`);
    } catch (error) {
      console.log(`Error creating vote:`, error);
    }
  }

  // Create bookmarks
  const bookmarksData: InsertResearchBookmark[] = [
    {
      researchItemId: createdItems[0].id,
      userId: userIds["researcher2@example.com"],
    },
    {
      researchItemId: createdItems[1].id,
      userId: userIds["researcher1@example.com"],
    },
    {
      researchItemId: createdItems[1].id,
      userId: userIds["researcher3@example.com"],
    },
  ];

  for (const bookmarkData of bookmarksData) {
    try {
      await db.insert(researchBookmarks).values(bookmarkData);
      console.log(`Created bookmark for research item ${bookmarkData.researchItemId}`);
    } catch (error) {
      console.log(`Error creating bookmark:`, error);
    }
  }

  // Seed Research announcements
  const announcementsData: InsertResearchAnnouncement[] = [
    {
      title: "Welcome to Research",
      content: "Use this platform to ask questions, share knowledge, and collaborate on research topics. Your contributions help build a valuable knowledge base for the community.",
      type: "info",
      isActive: true,
      expiresAt: null,
    },
    {
      title: "Community Guidelines",
      content: "Please be respectful and trauma-informed in all posts and comments. Remember that many community members are survivors. Focus on helpful, evidence-based information.",
      type: "info",
      isActive: true,
      expiresAt: null,
    },
    {
      title: "New Feature: Research Boards",
      content: "We've added research boards for organizing related questions and answers. Create boards to group topics together and collaborate more effectively.",
      type: "update",
      isActive: true,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    },
  ];

  for (const announcementData of announcementsData) {
    try {
      await db.insert(researchAnnouncements).values(announcementData);
      console.log(`Created Research announcement: ${announcementData.title}`);
    } catch (error) {
      console.log(`Error creating announcement "${announcementData.title}":`, error);
    }
  }

  console.log("\n✅ Research seed data created successfully!");
  console.log("\nSummary:");
  console.log(`- ${testUsers.length} users created`);
  console.log(`- ${researchItemsData.length} research items created`);
  console.log(`- ${answersData.length} answers created`);
  console.log(`- ${commentsData.length} comments created`);
  console.log(`- ${votesData.length} votes created`);
  console.log(`- ${bookmarksData.length} bookmarks created`);
  console.log(`- ${announcementsData.length} announcements created`);

  process.exit(0);
}

seedResearch().catch((error) => {
  console.error("Error seeding Research data:", error);
  process.exit(1);
});



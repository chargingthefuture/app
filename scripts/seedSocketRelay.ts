import { db } from "../server/db";
import { users, socketrelayProfiles, socketrelayRequests, socketrelayFulfillments, socketrelayMessages } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedSocketRelay() {
  console.log("Creating SocketRelay seed data...");

  // Create test users for SocketRelay
  const testUsers = [
    { email: "requester1@example.com", firstName: "Sarah", lastName: "Chen" },
    { email: "requester2@example.com", firstName: "Marcus", lastName: "Johnson" },
    { email: "requester3@example.com", firstName: "Lisa", lastName: "Rodriguez" },
    { email: "fulfiller1@example.com", firstName: "Alex", lastName: "Kim" },
    { email: "fulfiller2@example.com", firstName: "Jordan", lastName: "Taylor" },
    { email: "fulfiller3@example.com", firstName: "Morgan", lastName: "Davis" },
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
          inviteCodeUsed: "SOCKETRELAY-SEED",
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

  // Create SocketRelay profiles for all users
  const profilesData = [
    { email: "requester1@example.com", displayName: "Sarah C.", city: "Portland", state: "Oregon", country: "United States" },
    { email: "requester2@example.com", displayName: "Marcus J.", city: "Seattle", state: "Washington", country: "United States" },
    { email: "requester3@example.com", displayName: "Lisa R.", city: "San Francisco", state: "California", country: "United States" },
    { email: "fulfiller1@example.com", displayName: "Alex K.", city: "Portland", state: "Oregon", country: "United States" },
    { email: "fulfiller2@example.com", displayName: "Jordan T.", city: "Eugene", state: "Oregon", country: "United States" },
    { email: "fulfiller3@example.com", displayName: "Morgan D.", city: "Vancouver", state: "British Columbia", country: "Canada" },
  ];

  for (const profileData of profilesData) {
    try {
      await db.insert(socketrelayProfiles).values({
        userId: userIds[profileData.email],
        displayName: profileData.displayName,
        city: profileData.city,
        state: profileData.state,
        country: profileData.country,
      });
      console.log(`Created profile for: ${profileData.email}`);
    } catch (error) {
      console.log(`Profile for ${profileData.email} already exists`);
    }
  }

  // Create various requests
  const requestsData = [
    {
      userId: userIds["requester1@example.com"],
      description: "Need help moving furniture this weekend. Have a truck but need an extra pair of hands.",
      daysAgo: 2,
      status: 'active' as const,
    },
    {
      userId: userIds["requester2@example.com"],
      description: "Looking for someone to practice Spanish conversation with. I'm intermediate level.",
      daysAgo: 5,
      status: 'active' as const,
    },
    {
      userId: userIds["requester3@example.com"],
      description: "Can anyone recommend a good plumber in the downtown area? Urgent leak issue.",
      daysAgo: 1,
      status: 'active' as const,
    },
    {
      userId: userIds["requester1@example.com"],
      description: "Need someone to watch my cat while I'm on vacation next month for 2 weeks.",
      daysAgo: 7,
      status: 'fulfilled' as const,
    },
    {
      userId: userIds["requester2@example.com"],
      description: "Looking for carpool buddy from North Side to downtown, weekdays 8am-9am.",
      daysAgo: 10,
      status: 'closed' as const,
    },
    {
      userId: userIds["requester3@example.com"],
      description: "Anyone know a good recipe for vegan lasagna? Hosting dinner party next week.",
      daysAgo: 3,
      status: 'active' as const,
    },
    {
      userId: userIds["requester1@example.com"],
      description: "Need help debugging a Python script. It's throwing a weird error I can't figure out.",
      daysAgo: 4,
      status: 'fulfilled' as const,
    },
    {
      userId: userIds["requester2@example.com"],
      description: "Looking for recommendations for dog-friendly hiking trails within 30 miles of the city.",
      daysAgo: 6,
      status: 'active' as const,
    },
  ];

  const createdRequests: any[] = [];

  for (const reqData of requestsData) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - reqData.daysAgo);
    
    const expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + 14);

    const [request] = await db
      .insert(socketrelayRequests)
      .values({
        userId: reqData.userId,
        description: reqData.description,
        status: reqData.status,
        expiresAt: expiresAt,
        createdAt: createdAt,
        updatedAt: createdAt,
      })
      .returning();

    createdRequests.push(request);
    console.log(`Created request: "${reqData.description.substring(0, 50)}..."`);
  }

  // Create fulfillments for some requests
  const fulfillmentsData = [
    {
      requestIndex: 3, // cat watching
      fulfiller: userIds["fulfiller1@example.com"],
      status: 'completed_success' as const,
      hasMessages: true,
    },
    {
      requestIndex: 4, // carpool
      fulfiller: userIds["fulfiller2@example.com"],
      status: 'completed_failure' as const,
      hasMessages: true,
    },
    {
      requestIndex: 6, // Python debugging
      fulfiller: userIds["fulfiller3@example.com"],
      status: 'active' as const,
      hasMessages: true,
    },
  ];

  for (const fulfillmentData of fulfillmentsData) {
    const request = createdRequests[fulfillmentData.requestIndex];
    
    const fulfillmentCreatedAt = new Date(request.createdAt);
    fulfillmentCreatedAt.setHours(fulfillmentCreatedAt.getHours() + 2);

    const fulfillmentValues: any = {
      requestId: request.id,
      fulfillerUserId: fulfillmentData.fulfiller,
      status: fulfillmentData.status,
      createdAt: fulfillmentCreatedAt,
      updatedAt: fulfillmentCreatedAt,
    };

    if (fulfillmentData.status !== 'active') {
      const closedAt = new Date(fulfillmentCreatedAt);
      closedAt.setDate(closedAt.getDate() + 2);
      fulfillmentValues.closedBy = request.userId;
      fulfillmentValues.closedAt = closedAt;
    }

    const [fulfillment] = await db
      .insert(socketrelayFulfillments)
      .values(fulfillmentValues)
      .returning();

    console.log(`Created fulfillment for: "${request.description.substring(0, 50)}..."`);

    // Add messages to the chat if specified
    if (fulfillmentData.hasMessages) {
      const messagesData = [
        { sender: fulfillmentData.fulfiller, content: "Hi! I can help with this.", minutesAfter: 5 },
        { sender: request.userId, content: "That would be great! Thanks for reaching out.", minutesAfter: 15 },
        { sender: fulfillmentData.fulfiller, content: "When would be a good time?", minutesAfter: 20 },
        { sender: request.userId, content: "How about this Saturday morning?", minutesAfter: 30 },
        { sender: fulfillmentData.fulfiller, content: "Saturday works for me. What time?", minutesAfter: 45 },
        { sender: request.userId, content: "Is 9am okay?", minutesAfter: 50 },
        { sender: fulfillmentData.fulfiller, content: "Perfect! See you then.", minutesAfter: 55 },
      ];

      for (const msgData of messagesData) {
        const msgCreatedAt = new Date(fulfillmentCreatedAt);
        msgCreatedAt.setMinutes(msgCreatedAt.getMinutes() + msgData.minutesAfter);

        await db.insert(socketrelayMessages).values({
          fulfillmentId: fulfillment.id,
          senderId: msgData.sender,
          content: msgData.content,
          createdAt: msgCreatedAt,
        });
      }

      console.log(`  Added ${messagesData.length} messages to chat`);
    }
  }

  console.log("\n✅ SocketRelay seed data created successfully!");
  console.log("\nSummary:");
  console.log(`- ${testUsers.length} users created`);
  console.log(`- ${profilesData.length} profiles created`);
  console.log(`- ${requestsData.length} requests created`);
  console.log(`  - ${requestsData.filter(r => r.status === 'active').length} active requests`);
  console.log(`  - ${requestsData.filter(r => r.status === 'fulfilled').length} fulfilled requests`);
  console.log(`  - ${requestsData.filter(r => r.status === 'closed').length} closed requests`);
  console.log(`- ${fulfillmentsData.length} fulfillments created`);
  console.log(`  - ${fulfillmentsData.filter(f => f.status === 'active').length} active`);
  console.log(`  - ${fulfillmentsData.filter(f => f.status === 'completed_success').length} successful`);
  console.log(`  - ${fulfillmentsData.filter(f => f.status === 'completed_failure').length} failed`);
  console.log(`- ${fulfillmentsData.filter(f => f.hasMessages).length * 7} messages created`);
  
  process.exit(0);
}

seedSocketRelay().catch((error) => {
  console.error("Error seeding SocketRelay data:", error);
  process.exit(1);
});

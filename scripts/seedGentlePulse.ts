import { db } from "../server/db";
import {
  gentlepulseMeditations,
  gentlepulseRatings,
  gentlepulseMoodChecks,
  gentlepulseFavorites,
  gentlepulseAnnouncements,
  type InsertGentlepulseMeditation,
  type InsertGentlepulseRating,
  type InsertGentlepulseMoodCheck,
  type InsertGentlepulseFavorite,
  type InsertGentlepulseAnnouncement,
} from "../shared/schema";

async function seedGentlePulse() {
  console.log("Creating GentlePulse seed data...");

  // Seed GentlePulse meditations
  const meditationsData: InsertGentlepulseMeditation[] = [
    {
      title: "Morning Calm - 10 Minute Guided Meditation",
      description: "Start your day with peace and intention. This gentle meditation helps you set a positive tone for the day ahead.",
      thumbnail: "https://example.com/thumbnails/morning-calm.jpg",
      wistiaUrl: "https://example.wistia.com/medias/abc123",
      tags: JSON.stringify(["morning", "calm", "guided", "10-min"]),
      duration: 10,
      playCount: 245,
      averageRating: 4.5,
      ratingCount: 32,
      position: 1,
      isActive: true,
    },
    {
      title: "Deep Sleep - Body Scan for Rest",
      description: "A soothing body scan meditation designed to help you relax deeply and prepare for restful sleep.",
      thumbnail: "https://example.com/thumbnails/deep-sleep.jpg",
      wistiaUrl: "https://example.wistia.com/medias/def456",
      tags: JSON.stringify(["sleep", "body-scan", "relaxation", "20-min"]),
      duration: 20,
      playCount: 189,
      averageRating: 4.8,
      ratingCount: 28,
      position: 2,
      isActive: true,
    },
    {
      title: "Anxiety Relief - Breathing Practice",
      description: "When anxiety feels overwhelming, this breathing practice can help you find calm and center yourself.",
      thumbnail: "https://example.com/thumbnails/anxiety-relief.jpg",
      wistiaUrl: "https://example.wistia.com/medias/ghi789",
      tags: JSON.stringify(["anxiety", "breathing", "calm", "15-min"]),
      duration: 15,
      playCount: 312,
      averageRating: 4.7,
      ratingCount: 45,
      position: 3,
      isActive: true,
    },
    {
      title: "Self-Compassion - Loving Kindness",
      description: "Practice extending compassion to yourself and others with this loving-kindness meditation.",
      thumbnail: "https://example.com/thumbnails/self-compassion.jpg",
      wistiaUrl: "https://example.wistia.com/medias/jkl012",
      tags: JSON.stringify(["self-compassion", "loving-kindness", "healing", "12-min"]),
      duration: 12,
      playCount: 156,
      averageRating: 4.6,
      ratingCount: 22,
      position: 4,
      isActive: true,
    },
    {
      title: "Grounding - Present Moment Awareness",
      description: "When you feel disconnected or overwhelmed, this grounding meditation helps you return to the present moment.",
      thumbnail: "https://example.com/thumbnails/grounding.jpg",
      wistiaUrl: "https://example.wistia.com/medias/mno345",
      tags: JSON.stringify(["grounding", "present-moment", "mindfulness", "8-min"]),
      duration: 8,
      playCount: 278,
      averageRating: 4.4,
      ratingCount: 38,
      position: 5,
      isActive: true,
    },
    {
      title: "Trauma-Informed - Safe Space Visualization",
      description: "A gentle, trauma-informed meditation that helps you create and access a safe internal space.",
      thumbnail: "https://example.com/thumbnails/safe-space.jpg",
      wistiaUrl: "https://example.wistia.com/medias/pqr678",
      tags: JSON.stringify(["trauma-informed", "safe-space", "visualization", "18-min"]),
      duration: 18,
      playCount: 201,
      averageRating: 4.9,
      ratingCount: 29,
      position: 6,
      isActive: true,
    },
  ];

  const createdMeditations: any[] = [];

  for (const meditationData of meditationsData) {
    try {
      const [meditation] = await db
        .insert(gentlepulseMeditations)
        .values(meditationData)
        .returning();
      createdMeditations.push(meditation);
      console.log(`Created meditation: ${meditationData.title}`);
    } catch (error) {
      console.log(`Error creating meditation "${meditationData.title}":`, error);
    }
  }

  // Create sample ratings (using clientId since ratings are anonymous)
  const clientIds = [
    "client-uuid-1",
    "client-uuid-2",
    "client-uuid-3",
    "client-uuid-4",
    "client-uuid-5",
  ];

  const ratingsData: InsertGentlepulseRating[] = [
    {
      meditationId: createdMeditations[0].id,
      clientId: clientIds[0],
      rating: 5,
    },
    {
      meditationId: createdMeditations[0].id,
      clientId: clientIds[1],
      rating: 4,
    },
    {
      meditationId: createdMeditations[1].id,
      clientId: clientIds[0],
      rating: 5,
    },
    {
      meditationId: createdMeditations[1].id,
      clientId: clientIds[2],
      rating: 5,
    },
    {
      meditationId: createdMeditations[2].id,
      clientId: clientIds[1],
      rating: 4,
    },
    {
      meditationId: createdMeditations[2].id,
      clientId: clientIds[3],
      rating: 5,
    },
    {
      meditationId: createdMeditations[5].id,
      clientId: clientIds[4],
      rating: 5,
    },
  ];

  for (const ratingData of ratingsData) {
    try {
      await db.insert(gentlepulseRatings).values(ratingData);
      console.log(`Created rating for meditation ${ratingData.meditationId}`);
    } catch (error) {
      console.log(`Error creating rating:`, error);
    }
  }

  // Create sample mood checks
  const moodChecksData: InsertGentlepulseMoodCheck[] = [
    {
      clientId: clientIds[0],
      moodValue: 3,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      clientId: clientIds[0],
      moodValue: 4,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      clientId: clientIds[0],
      moodValue: 4,
      date: new Date(), // Today
    },
    {
      clientId: clientIds[1],
      moodValue: 2,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      clientId: clientIds[1],
      moodValue: 3,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      clientId: clientIds[2],
      moodValue: 4,
      date: new Date(), // Today
    },
  ];

  for (const moodCheckData of moodChecksData) {
    try {
      await db.insert(gentlepulseMoodChecks).values(moodCheckData);
      console.log(`Created mood check for client ${moodCheckData.clientId}`);
    } catch (error) {
      console.log(`Error creating mood check:`, error);
    }
  }

  // Create sample favorites
  const favoritesData: InsertGentlepulseFavorite[] = [
    {
      meditationId: createdMeditations[0].id,
      clientId: clientIds[0],
    },
    {
      meditationId: createdMeditations[1].id,
      clientId: clientIds[0],
    },
    {
      meditationId: createdMeditations[2].id,
      clientId: clientIds[1],
    },
    {
      meditationId: createdMeditations[5].id,
      clientId: clientIds[2],
    },
    {
      meditationId: createdMeditations[5].id,
      clientId: clientIds[3],
    },
  ];

  for (const favoriteData of favoritesData) {
    try {
      await db.insert(gentlepulseFavorites).values(favoriteData);
      console.log(`Created favorite for meditation ${favoriteData.meditationId}`);
    } catch (error) {
      console.log(`Error creating favorite:`, error);
    }
  }

  // Seed GentlePulse announcements
  const announcementsData: InsertGentlepulseAnnouncement[] = [
    {
      title: "Welcome to GentlePulse",
      content: "GentlePulse offers a curated library of trauma-informed meditations and mindfulness practices. All content is designed with survivor safety and healing in mind.",
      type: "info",
      isActive: true,
      expiresAt: null,
    },
    {
      title: "New Meditations Added",
      content: "We've added three new guided meditations this month: 'Morning Calm', 'Anxiety Relief', and 'Trauma-Informed Safe Space'. Check them out in the library!",
      type: "update",
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    {
      title: "Privacy Reminder",
      content: "All usage is anonymous. We don't track personal information. Your mood checks, favorites, and ratings are stored locally on your device when possible.",
      type: "info",
      isActive: true,
      expiresAt: null,
    },
    {
      title: "Take Your Time",
      content: "Remember, meditation is a practice, not a performance. There's no right or wrong way to meditate. Be gentle with yourself.",
      type: "info",
      isActive: true,
      expiresAt: null,
    },
  ];

  for (const announcementData of announcementsData) {
    try {
      await db.insert(gentlepulseAnnouncements).values(announcementData);
      console.log(`Created GentlePulse announcement: ${announcementData.title}`);
    } catch (error) {
      console.log(`Error creating announcement "${announcementData.title}":`, error);
    }
  }

  console.log("\n✅ GentlePulse seed data created successfully!");
  console.log("\nSummary:");
  console.log(`- ${meditationsData.length} meditations created`);
  console.log(`- ${ratingsData.length} ratings created`);
  console.log(`- ${moodChecksData.length} mood checks created`);
  console.log(`- ${favoritesData.length} favorites created`);
  console.log(`- ${announcementsData.length} announcements created`);

  process.exit(0);
}

seedGentlePulse().catch((error) => {
  console.error("Error seeding GentlePulse data:", error);
  process.exit(1);
});



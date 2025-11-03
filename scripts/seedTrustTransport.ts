import { db } from "../server/db";
import { users, trusttransportProfiles, trusttransportRides } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedTrustTransport() {
  console.log("Creating TrustTransport seed data...");

  // Create test users for TrustTransport
  const testUsers = [
    { email: "driver1@example.com", firstName: "John", lastName: "Smith" },
    { email: "driver2@example.com", firstName: "Maria", lastName: "Garcia" },
    { email: "driver3@example.com", firstName: "David", lastName: "Brown" },
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
          inviteCodeUsed: "TRUSTTRANSPORT-SEED",
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

  // Create TrustTransport profiles for all users
  const profilesData = [
    {
      userId: userIds["driver1@example.com"],
      displayName: "John S.",
      city: "San Francisco",
      state: "California",
      country: "United States",
      vehicleMake: "Toyota",
      vehicleModel: "Camry",
      vehicleYear: 2020,
      vehicleColor: "Silver",
      bio: "Experienced driver offering safe rides",
      isActive: true,
    },
    {
      userId: userIds["driver2@example.com"],
      displayName: "Maria G.",
      city: "Los Angeles",
      state: "California",
      country: "United States",
      vehicleMake: "Honda",
      vehicleModel: "Accord",
      vehicleYear: 2019,
      vehicleColor: "Blue",
      bio: "Safe and reliable transportation",
      isActive: true,
    },
    {
      userId: userIds["driver3@example.com"],
      displayName: "David B.",
      city: "San Diego",
      state: "California",
      country: "United States",
      vehicleMake: "Nissan",
      vehicleModel: "Altima",
      vehicleYear: 2021,
      vehicleColor: "Black",
      bio: "Comfortable rides with music",
      isActive: true,
    },
  ];

  const profileIds: Record<string, string> = {};

  for (const profileData of profilesData) {
    try {
      // Check if profile already exists
      const [existing] = await db
        .select()
        .from(trusttransportProfiles)
        .where(eq(trusttransportProfiles.userId, profileData.userId));

      if (existing) {
        profileIds[profileData.userId] = existing.id;
        console.log(`Profile for user ${profileData.userId} already exists`);
        continue;
      }

      const [profile] = await db
        .insert(trusttransportProfiles)
        .values(profileData)
        .returning();

      profileIds[profileData.userId] = profile.id;
      console.log(`Created profile for user ${profileData.userId}`);
    } catch (error: any) {
      console.error(`Error creating profile for user ${profileData.userId}:`, error.message);
    }
  }

  // Create sample rides
  const futureDate1 = new Date();
  futureDate1.setDate(futureDate1.getDate() + 3);
  const futureDate2 = new Date();
  futureDate2.setDate(futureDate2.getDate() + 5);
  const futureDate3 = new Date();
  futureDate3.setDate(futureDate3.getDate() + 7);

  const ridesData = [
    {
      driverId: profileIds[userIds["driver1@example.com"]],
      pickupLocation: "123 Main St, San Francisco, CA",
      dropoffLocation: "456 Market St, Oakland, CA",
      pickupCity: "San Francisco",
      pickupState: "California",
      dropoffCity: "Oakland",
      dropoffState: "California",
      departureDateTime: futureDate1,
      pricePerSeat: "15.00",
      isFree: false,
      availableSeats: 3,
      maxSeats: 4,
      description: "Regular commute route, comfortable ride",
      notes: "Pet friendly, non-smoking",
      status: "active",
    },
    {
      driverId: profileIds[userIds["driver2@example.com"]],
      pickupLocation: "789 Sunset Blvd, Los Angeles, CA",
      dropoffLocation: "321 Hollywood Blvd, Los Angeles, CA",
      pickupCity: "Los Angeles",
      pickupState: "California",
      dropoffCity: "Los Angeles",
      dropoffState: "California",
      departureDateTime: futureDate2,
      pricePerSeat: "0.00",
      isFree: true,
      availableSeats: 2,
      maxSeats: 2,
      description: "Free ride to help the community",
      notes: "Comfortable and safe",
      status: "active",
    },
    {
      driverId: profileIds[userIds["driver3@example.com"]],
      pickupLocation: "555 Beach Dr, San Diego, CA",
      dropoffLocation: "777 Harbor Way, San Diego, CA",
      pickupCity: "San Diego",
      pickupState: "California",
      dropoffCity: "San Diego",
      dropoffState: "California",
      departureDateTime: futureDate3,
      pricePerSeat: "10.00",
      isFree: false,
      availableSeats: 1,
      maxSeats: 3,
      description: "Quick trip downtown",
      notes: "Air conditioning, music available",
      status: "active",
    },
  ];

  for (const rideData of ridesData) {
    try {
      await db
        .insert(trusttransportRides)
        .values(rideData);
      console.log(`Created ride from ${rideData.pickupCity} to ${rideData.dropoffCity}`);
    } catch (error: any) {
      console.error(`Error creating ride:`, error.message);
    }
  }

  console.log("TrustTransport seed data created successfully!");
}

seedTrustTransport()
  .then(() => {
    console.log("Seeding complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding:", error);
    process.exit(1);
  });





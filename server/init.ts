import { storage } from "./storage";

async function initializeDefaultPricingTier() {
  try {
    // Check if a current pricing tier exists
    const currentTier = await storage.getCurrentPricingTier();
    
    if (!currentTier) {
      console.log("No current pricing tier found. Creating default tier...");
      await storage.createPricingTier({
        amount: '1.00',
        effectiveDate: new Date(),
        isCurrentTier: true,
      });
      console.log("Default pricing tier ($1.00/month) created successfully");
    } else {
      console.log(`Current pricing tier exists: $${currentTier.amount}/month`);
    }
  } catch (error) {
    console.error("Error initializing pricing tier:", error);
  }
}

// Run initialization
initializeDefaultPricingTier();

import { db } from "../server/db";
import {
  workforceRecruiterConfig,
  workforceRecruiterOccupations,
  type InsertWorkforceRecruiterConfig,
  type InsertWorkforceRecruiterOccupation,
} from "../shared/schema";
import { eq, and } from "drizzle-orm";

async function seedWorkforceRecruiter() {
  console.log("Seeding Workforce Recruiter Tracker...");

  // Create or update config
  const [existingConfig] = await db.select().from(workforceRecruiterConfig).limit(1);
  if (existingConfig) {
    console.log("Config already exists, skipping...");
  } else {
    const configData: InsertWorkforceRecruiterConfig = {
      population: 5000000,
      workforceParticipationRate: '0.5',
      minRecruitable: 2000000,
      maxRecruitable: 5000000,
    };
    await db.insert(workforceRecruiterConfig).values(configData);
    console.log("Created config");
  }

  // Occupation data from requirements
  const occupationsData: InsertWorkforceRecruiterOccupation[] = [
    // Health — total ~150,000
    { sector: "Health", occupationTitle: "Physicians (generalists + specialists)", headcountTarget: 18750, skillLevel: "High", annualTrainingTarget: 1125, notes: null },
    { sector: "Health", occupationTitle: "Nurses & midwives", headcountTarget: 93750, skillLevel: "High", annualTrainingTarget: 5625, notes: null },
    { sector: "Health", occupationTitle: "Pharmacists", headcountTarget: 3750, skillLevel: "High", annualTrainingTarget: 225, notes: null },
    { sector: "Health", occupationTitle: "Laboratory technicians", headcountTarget: 7500, skillLevel: "Medium", annualTrainingTarget: 300, notes: null },
    { sector: "Health", occupationTitle: "Radiographers & imaging techs", headcountTarget: 2500, skillLevel: "Medium", annualTrainingTarget: 100, notes: null },
    { sector: "Health", occupationTitle: "Community health workers / CHWs", headcountTarget: 15000, skillLevel: "Low", annualTrainingTarget: 600, notes: null },
    { sector: "Health", occupationTitle: "Emergency medical technicians/paramedics", headcountTarget: 3750, skillLevel: "Medium", annualTrainingTarget: 150, notes: null },
    { sector: "Health", occupationTitle: "Public-health officers/epidemiologists", headcountTarget: 3750, skillLevel: "High", annualTrainingTarget: 225, notes: null },

    // Education — total ~60,000
    { sector: "Education", occupationTitle: "Primary school teachers", headcountTarget: 30000, skillLevel: "Medium", annualTrainingTarget: 1200, notes: null },
    { sector: "Education", occupationTitle: "Secondary school teachers", headcountTarget: 18000, skillLevel: "High", annualTrainingTarget: 720, notes: null },
    { sector: "Education", occupationTitle: "Early-childhood educators", headcountTarget: 3000, skillLevel: "Medium", annualTrainingTarget: 120, notes: null },
    { sector: "Education", occupationTitle: "Vocational & technical trainers", headcountTarget: 3000, skillLevel: "Medium", annualTrainingTarget: 120, notes: null },
    { sector: "Education", occupationTitle: "School administrators & support staff", headcountTarget: 6000, skillLevel: "Medium", annualTrainingTarget: 240, notes: null },

    // Agriculture & Food — total ~200,000
    { sector: "Agriculture & Food", occupationTitle: "Farmers (crop producers)", headcountTarget: 120000, skillLevel: "Low", annualTrainingTarget: 4800, notes: null },
    { sector: "Agriculture & Food", occupationTitle: "Livestock farmers/herders", headcountTarget: 30000, skillLevel: "Low", annualTrainingTarget: 1200, notes: null },
    { sector: "Agriculture & Food", occupationTitle: "Agricultural technicians/agronomists/extension officers", headcountTarget: 10000, skillLevel: "Medium", annualTrainingTarget: 400, notes: null },
    { sector: "Agriculture & Food", occupationTitle: "Veterinarians & animal health techs", headcountTarget: 3000, skillLevel: "High", annualTrainingTarget: 180, notes: null },
    { sector: "Agriculture & Food", occupationTitle: "Food-processing workers (factory floor)", headcountTarget: 25000, skillLevel: "Low", annualTrainingTarget: 1000, notes: null },
    { sector: "Agriculture & Food", occupationTitle: "Agribusiness managers & supply-chain staff", headcountTarget: 12000, skillLevel: "High", annualTrainingTarget: 480, notes: null },

    // Manufacturing & Industry — total ~200,000
    { sector: "Manufacturing & Industry", occupationTitle: "Production line workers / operators", headcountTarget: 120000, skillLevel: "Low", annualTrainingTarget: 4800, notes: null },
    { sector: "Manufacturing & Industry", occupationTitle: "Maintenance technicians / millwrights", headcountTarget: 20000, skillLevel: "Medium", annualTrainingTarget: 800, notes: null },
    { sector: "Manufacturing & Industry", occupationTitle: "Quality-control inspectors", headcountTarget: 10000, skillLevel: "Medium", annualTrainingTarget: 400, notes: null },
    { sector: "Manufacturing & Industry", occupationTitle: "Plant supervisors / managers", headcountTarget: 10000, skillLevel: "High", annualTrainingTarget: 400, notes: null },
    { sector: "Manufacturing & Industry", occupationTitle: "Industrial engineers & process technologists", headcountTarget: 10000, skillLevel: "High", annualTrainingTarget: 600, notes: null },
    { sector: "Manufacturing & Industry", occupationTitle: "Logistics & warehouse staff (manufacturing-specific)", headcountTarget: 30000, skillLevel: "Medium", annualTrainingTarget: 1200, notes: null },

    // Retail & Services — total ~200,000
    { sector: "Retail & Services", occupationTitle: "Retail sales staff / cashiers", headcountTarget: 100000, skillLevel: "Low", annualTrainingTarget: 4000, notes: null },
    { sector: "Retail & Services", occupationTitle: "Supermarket / store managers", headcountTarget: 10000, skillLevel: "Medium", annualTrainingTarget: 400, notes: null },
    { sector: "Retail & Services", occupationTitle: "Cleaners & facility services", headcountTarget: 30000, skillLevel: "Low", annualTrainingTarget: 1200, notes: null },
    { sector: "Retail & Services", occupationTitle: "Personal services (hairdressers, repair techs)", headcountTarget: 30000, skillLevel: "Low", annualTrainingTarget: 1200, notes: null },
    { sector: "Retail & Services", occupationTitle: "Customer service & call-center agents", headcountTarget: 30000, skillLevel: "Medium", annualTrainingTarget: 1200, notes: null },

    // Public administration & Finance — total ~150,000
    { sector: "Public Administration & Finance", occupationTitle: "Civil servants (local & central administration)", headcountTarget: 75000, skillLevel: "Medium", annualTrainingTarget: 3000, notes: null },
    { sector: "Public Administration & Finance", occupationTitle: "Tax & customs officers", headcountTarget: 7500, skillLevel: "Medium", annualTrainingTarget: 300, notes: null },
    { sector: "Public Administration & Finance", occupationTitle: "Accountants & auditors", headcountTarget: 15000, skillLevel: "High", annualTrainingTarget: 900, notes: null },
    { sector: "Public Administration & Finance", occupationTitle: "Bank staff & tellers", headcountTarget: 20000, skillLevel: "Medium", annualTrainingTarget: 800, notes: null },
    { sector: "Public Administration & Finance", occupationTitle: "Regulators & economic planners", headcountTarget: 7500, skillLevel: "High", annualTrainingTarget: 450, notes: null },
    { sector: "Public Administration & Finance", occupationTitle: "Procurement & public-project managers", headcountTarget: 25000, skillLevel: "High", annualTrainingTarget: 1000, notes: null },

    // Construction & Housing — total ~150,000
    { sector: "Construction & Housing", occupationTitle: "Construction laborers", headcountTarget: 80000, skillLevel: "Low", annualTrainingTarget: 3200, notes: null },
    { sector: "Construction & Housing", occupationTitle: "Electricians", headcountTarget: 15000, skillLevel: "Medium", annualTrainingTarget: 600, notes: null },
    { sector: "Construction & Housing", occupationTitle: "Plumbers", headcountTarget: 10000, skillLevel: "Medium", annualTrainingTarget: 400, notes: null },
    { sector: "Construction & Housing", occupationTitle: "Civil & structural engineers", headcountTarget: 7500, skillLevel: "High", annualTrainingTarget: 450, notes: null },
    { sector: "Construction & Housing", occupationTitle: "Architects & building designers", headcountTarget: 2500, skillLevel: "High", annualTrainingTarget: 150, notes: null },
    { sector: "Construction & Housing", occupationTitle: "HVAC / insulation / building systems techs", headcountTarget: 7500, skillLevel: "Medium", annualTrainingTarget: 300, notes: null },
    { sector: "Construction & Housing", occupationTitle: "Site supervisors / foremen", headcountTarget: 7500, skillLevel: "Medium", annualTrainingTarget: 300, notes: null },
    { sector: "Construction & Housing", occupationTitle: "Surveyors", headcountTarget: 2500, skillLevel: "Medium", annualTrainingTarget: 100, notes: null },

    // Transport & Logistics — total ~100,000
    { sector: "Transport & Logistics", occupationTitle: "Truck & delivery drivers", headcountTarget: 35000, skillLevel: "Low", annualTrainingTarget: 1400, notes: null },
    { sector: "Transport & Logistics", occupationTitle: "Bus / public-transport drivers", headcountTarget: 12000, skillLevel: "Low", annualTrainingTarget: 480, notes: null },
    { sector: "Transport & Logistics", occupationTitle: "Mechanics & vehicle technicians", headcountTarget: 15000, skillLevel: "Medium", annualTrainingTarget: 600, notes: null },
    { sector: "Transport & Logistics", occupationTitle: "Rail / port / airport operations staff", headcountTarget: 10000, skillLevel: "Medium", annualTrainingTarget: 400, notes: null },
    { sector: "Transport & Logistics", occupationTitle: "Logistics planners / freight managers", headcountTarget: 8000, skillLevel: "Medium", annualTrainingTarget: 320, notes: null },
    { sector: "Transport & Logistics", occupationTitle: "Warehouse & fulfillment workers", headcountTarget: 20000, skillLevel: "Low", annualTrainingTarget: 800, notes: null },

    // Telecommunications & IT — total ~62,500
    { sector: "Telecommunications & IT", occupationTitle: "Network engineers & field technicians", headcountTarget: 12500, skillLevel: "Medium", annualTrainingTarget: 500, notes: null },
    { sector: "Telecommunications & IT", occupationTitle: "IT support & helpdesk", headcountTarget: 12500, skillLevel: "Medium", annualTrainingTarget: 500, notes: null },
    { sector: "Telecommunications & IT", occupationTitle: "Software developers & engineers", headcountTarget: 15000, skillLevel: "High", annualTrainingTarget: 900, notes: null },
    { sector: "Telecommunications & IT", occupationTitle: "Data-center technicians & operators", headcountTarget: 5000, skillLevel: "Medium", annualTrainingTarget: 200, notes: null },
    { sector: "Telecommunications & IT", occupationTitle: "Cybersecurity specialists", headcountTarget: 2500, skillLevel: "High", annualTrainingTarget: 150, notes: null },
    { sector: "Telecommunications & IT", occupationTitle: "Telecom customer-service & sales", headcountTarget: 15000, skillLevel: "Low", annualTrainingTarget: 600, notes: null },

    // Public Safety & Justice — total ~37,500
    { sector: "Public Safety & Justice", occupationTitle: "Police officers", headcountTarget: 25000, skillLevel: "Medium", annualTrainingTarget: 1000, notes: null },
    { sector: "Public Safety & Justice", occupationTitle: "Firefighters", headcountTarget: 5000, skillLevel: "Medium", annualTrainingTarget: 200, notes: null },
    { sector: "Public Safety & Justice", occupationTitle: "Corrections officers & prison staff", headcountTarget: 3000, skillLevel: "Medium", annualTrainingTarget: 120, notes: null },
    { sector: "Public Safety & Justice", occupationTitle: "Judges, prosecutors & legal officers", headcountTarget: 2000, skillLevel: "High", annualTrainingTarget: 120, notes: null },
    { sector: "Public Safety & Justice", occupationTitle: "Forensic & crime-scene technicians", headcountTarget: 500, skillLevel: "High", annualTrainingTarget: 20, notes: null },
    { sector: "Public Safety & Justice", occupationTitle: "Emergency management planners", headcountTarget: 1000, skillLevel: "High", annualTrainingTarget: 40, notes: null },

    // Energy & Utilities — total ~30,000
    { sector: "Energy & Utilities", occupationTitle: "Power-plant operators & technicians", headcountTarget: 7500, skillLevel: "Medium", annualTrainingTarget: 300, notes: null },
    { sector: "Energy & Utilities", occupationTitle: "Electrical engineers (grid & distribution)", headcountTarget: 5000, skillLevel: "High", annualTrainingTarget: 300, notes: null },
    { sector: "Energy & Utilities", occupationTitle: "Renewable-energy technicians (solar/wind)", headcountTarget: 3000, skillLevel: "Medium", annualTrainingTarget: 120, notes: null },
    { sector: "Energy & Utilities", occupationTitle: "Utility maintenance crews (lines, substations)", headcountTarget: 7500, skillLevel: "Medium", annualTrainingTarget: 300, notes: null },
    { sector: "Energy & Utilities", occupationTitle: "Metering & billing staff", headcountTarget: 3000, skillLevel: "Low", annualTrainingTarget: 120, notes: null },
    { sector: "Energy & Utilities", occupationTitle: "Energy planners & regulators", headcountTarget: 4000, skillLevel: "High", annualTrainingTarget: 240, notes: null },

    // Water & Sanitation — total ~20,000
    { sector: "Water & Sanitation", occupationTitle: "Water-treatment plant operators", headcountTarget: 5000, skillLevel: "Medium", annualTrainingTarget: 200, notes: null },
    { sector: "Water & Sanitation", occupationTitle: "Civil engineers (water resources)", headcountTarget: 2500, skillLevel: "High", annualTrainingTarget: 150, notes: null },
    { sector: "Water & Sanitation", occupationTitle: "Distribution & maintenance technicians", headcountTarget: 7500, skillLevel: "Medium", annualTrainingTarget: 300, notes: null },
    { sector: "Water & Sanitation", occupationTitle: "Plumbers & sewer technicians", headcountTarget: 3000, skillLevel: "Medium", annualTrainingTarget: 120, notes: null },
    { sector: "Water & Sanitation", occupationTitle: "Water-quality lab techs", headcountTarget: 2000, skillLevel: "Medium", annualTrainingTarget: 80, notes: null },

    // Tourism & Hospitality — total ~37,500
    { sector: "Tourism & Hospitality", occupationTitle: "Hotel staff (housekeeping, front desk)", headcountTarget: 15000, skillLevel: "Low", annualTrainingTarget: 600, notes: null },
    { sector: "Tourism & Hospitality", occupationTitle: "Chefs & kitchen staff", headcountTarget: 8000, skillLevel: "Medium", annualTrainingTarget: 320, notes: null },
    { sector: "Tourism & Hospitality", occupationTitle: "Tour guides & travel agents", headcountTarget: 4000, skillLevel: "Medium", annualTrainingTarget: 160, notes: null },
    { sector: "Tourism & Hospitality", occupationTitle: "Event & conference staff", headcountTarget: 3000, skillLevel: "Low", annualTrainingTarget: 120, notes: null },
    { sector: "Tourism & Hospitality", occupationTitle: "Hospitality managers & marketing", headcountTarget: 7500, skillLevel: "Medium", annualTrainingTarget: 300, notes: null },

    // Mining / Extractives — total ~12,500
    { sector: "Mining / Extractives", occupationTitle: "Miners & drill operators", headcountTarget: 6000, skillLevel: "Low", annualTrainingTarget: 240, notes: null },
    { sector: "Mining / Extractives", occupationTitle: "Mining engineers & geologists", headcountTarget: 2000, skillLevel: "High", annualTrainingTarget: 120, notes: null },
    { sector: "Mining / Extractives", occupationTitle: "Safety & environmental officers", headcountTarget: 2000, skillLevel: "Medium", annualTrainingTarget: 80, notes: null },
    { sector: "Mining / Extractives", occupationTitle: "Processing plant workers", headcountTarget: 2500, skillLevel: "Medium", annualTrainingTarget: 100, notes: null },

    // R&D & High-Tech — total ~20,000
    { sector: "R&D & High-Tech", occupationTitle: "Researchers & scientists", headcountTarget: 6000, skillLevel: "High", annualTrainingTarget: 360, notes: null },
    { sector: "R&D & High-Tech", occupationTitle: "Lab technicians", headcountTarget: 6000, skillLevel: "Medium", annualTrainingTarget: 240, notes: null },
    { sector: "R&D & High-Tech", occupationTitle: "Product engineers & designers", headcountTarget: 5000, skillLevel: "High", annualTrainingTarget: 300, notes: null },
    { sector: "R&D & High-Tech", occupationTitle: "R&D managers & grant administrators", headcountTarget: 3000, skillLevel: "High", annualTrainingTarget: 180, notes: null },

    // Creative & Media — total ~17,500
    { sector: "Creative & Media", occupationTitle: "Journalists & reporters", headcountTarget: 3000, skillLevel: "Medium", annualTrainingTarget: 120, notes: null },
    { sector: "Creative & Media", occupationTitle: "Graphic designers & artists", headcountTarget: 5000, skillLevel: "Medium", annualTrainingTarget: 200, notes: null },
    { sector: "Creative & Media", occupationTitle: "Film/TV/audio production staff", headcountTarget: 4000, skillLevel: "Medium", annualTrainingTarget: 160, notes: null },
    { sector: "Creative & Media", occupationTitle: "Marketing content creators & social media", headcountTarget: 5500, skillLevel: "Medium", annualTrainingTarget: 220, notes: null },

    // Environmental & Waste Management — total ~25,000
    { sector: "Environmental & Waste Management", occupationTitle: "Waste-collection crews & recyclers", headcountTarget: 12000, skillLevel: "Low", annualTrainingTarget: 480, notes: null },
    { sector: "Environmental & Waste Management", occupationTitle: "Environmental engineers & specialists", headcountTarget: 4000, skillLevel: "High", annualTrainingTarget: 240, notes: null },
    { sector: "Environmental & Waste Management", occupationTitle: "Conservation officers & park rangers", headcountTarget: 3000, skillLevel: "Medium", annualTrainingTarget: 120, notes: null },
    { sector: "Environmental & Waste Management", occupationTitle: "Recycling plant operators", headcountTarget: 6000, skillLevel: "Medium", annualTrainingTarget: 240, notes: null },

    // Microfinance & SME Support — total ~12,500
    { sector: "Microfinance & SME Support", occupationTitle: "Microfinance officers & loan officers", headcountTarget: 6000, skillLevel: "Medium", annualTrainingTarget: 240, notes: null },
    { sector: "Microfinance & SME Support", occupationTitle: "Business development advisors / trainers", headcountTarget: 4000, skillLevel: "Medium", annualTrainingTarget: 160, notes: null },
    { sector: "Microfinance & SME Support", occupationTitle: "Cooperative managers & support staff", headcountTarget: 2500, skillLevel: "Medium", annualTrainingTarget: 100, notes: null },

    // Emergency & Reserve capacity — total ~15,000
    { sector: "Emergency & Reserve", occupationTitle: "Disaster-response specialists & logistics", headcountTarget: 3000, skillLevel: "High", annualTrainingTarget: 120, notes: null },
    { sector: "Emergency & Reserve", occupationTitle: "Reserve medical teams & mobile clinic staff", headcountTarget: 6000, skillLevel: "Medium", annualTrainingTarget: 240, notes: null },
    { sector: "Emergency & Reserve", occupationTitle: "Temporary shelter & relief operations staff", headcountTarget: 3000, skillLevel: "Low", annualTrainingTarget: 120, notes: null },
    { sector: "Emergency & Reserve", occupationTitle: "Emergency logistics & supply-chain reserves", headcountTarget: 3000, skillLevel: "Medium", annualTrainingTarget: 120, notes: null },
  ];

  let created = 0;
  let skipped = 0;

  for (const occupationData of occupationsData) {
    try {
      // Check if occupation already exists (by sector + title)
      const existing = await db
        .select()
        .from(workforceRecruiterOccupations)
        .where(
          and(
            eq(workforceRecruiterOccupations.sector, occupationData.sector),
            eq(workforceRecruiterOccupations.occupationTitle, occupationData.occupationTitle)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      await db.insert(workforceRecruiterOccupations).values(occupationData);
      created++;
      console.log(`Created: ${occupationData.sector} - ${occupationData.occupationTitle}`);
    } catch (error: any) {
      console.error(`Error creating occupation ${occupationData.occupationTitle}:`, error.message);
    }
  }

  // Calculate totals
  const allOccupations = await db.select().from(workforceRecruiterOccupations);
  const totalTarget = allOccupations.reduce((sum, occ) => sum + occ.headcountTarget, 0);
  const totalTraining = allOccupations.reduce((sum, occ) => sum + occ.annualTrainingTarget, 0);

  console.log("\n✅ Workforce Recruiter Tracker seed complete!");
  console.log(`- Created: ${created} occupations`);
  console.log(`- Skipped (already exist): ${skipped} occupations`);
  console.log(`- Total occupations: ${allOccupations.length}`);
  console.log(`- Total headcount target: ${totalTarget.toLocaleString()}`);
  console.log(`- Total annual training target: ${totalTraining.toLocaleString()}`);
  console.log(`- Expected workforce total: ~2,500,000`);
  
  process.exit(0);
}

seedWorkforceRecruiter().catch((error) => {
  console.error("Error seeding Workforce Recruiter Tracker:", error);
  process.exit(1);
});


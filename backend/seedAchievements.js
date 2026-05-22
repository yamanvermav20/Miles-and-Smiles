/**
 * Seed Achievements Script
 * Populates the database with default achievement definitions
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { seedAchievements, DEFAULT_ACHIEVEMENTS } from "./src/services/achievementService.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/miles-and-smiles";

async function main() {
  console.log("🏆 Achievement Seeder");
  console.log("=====================\n");
  
  try {
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");
    
    console.log(`📝 Seeding ${DEFAULT_ACHIEVEMENTS.length} achievements...`);
    await seedAchievements();
    
    console.log("\n✅ Achievement seeding complete!");
    console.log("\nAchievements by category:");
    
    const categories = {};
    for (const a of DEFAULT_ACHIEVEMENTS) {
      categories[a.category] = (categories[a.category] || 0) + 1;
    }
    
    for (const [category, count] of Object.entries(categories)) {
      console.log(`  - ${category}: ${count}`);
    }
    
  } catch (error) {
    console.error("❌ Error seeding achievements:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Done!");
  }
}

main();

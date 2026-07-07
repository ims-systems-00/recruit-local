import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";

// import { userSeeder } from "./user.seeder";
// import { statusSeeder } from "./status.seeder";
import { valueSeeder } from "./value.seeder";
import { jobTitleSeeder } from "./job-title.seeder";
import { industrySeeder } from "./industry.seeder";
import { experienceLevelSeeder } from "./experience-level.seeder";
import { workModeSeeder } from "./work-mode.seeder";
import { logger } from "../common/helper/logger";

const runSeeders = async () => {
  try {
    await connectDB();
    logger.info(`Connected to ${process.env.NODE_ENV} database`);

    // Seeders to run
    // await userSeeder();
    // await statusSeeder();
    await valueSeeder();
    await jobTitleSeeder();
    await industrySeeder();
    await experienceLevelSeeder();
    await workModeSeeder();
    logger.info("Seeding completed");
  } catch (error) {
    logger.error("Error connecting to MongoDB", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

runSeeders();

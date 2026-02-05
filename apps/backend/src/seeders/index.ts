import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";

// import { userSeeder } from "./user.seeder";
import { statusSeeder } from "./status.seeder";
import { logger } from "../common/helper/logger";

const runSeeders = async () => {
  try {
    await connectDB();
    logger.info(`Connected to ${process.env.NODE_ENV} database`);

    // Seeders to run
    // await userSeeder();
    await statusSeeder();
    logger.info("Seeding completed");
  } catch (error) {
    logger.error("Error connecting to MongoDB", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

runSeeders();

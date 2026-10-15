import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";
import { valueAssessmentSeeder } from "../seeders/value-assessment.seeder";
import { logger } from "../common/helper/logger";

/**
 * Seeds the value self-evaluation questions on their own, without running any
 * other seeder — the way an existing database gets them, and the way a question
 * change made in `value-assessments.content.ts` reaches one.
 *
 * Safe to re-run: it only sets `assessment` on values that already exist.
 *
 *   pnpm --filter @rl/backend seed:value-assessments:dev
 */
const seedValueAssessments = async () => {
  try {
    await connectDB();
    logger.info(`Connected to the ${process.env.DATABASE_NAME} database`);

    await valueAssessmentSeeder();
  } catch (error) {
    logger.error("Error seeding value assessments", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedValueAssessments();

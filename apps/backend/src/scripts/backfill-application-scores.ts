import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";
import { Application } from "../models";
import { recomputeApplicationScore } from "../v1/modules/application/ranking.service";
import { logger } from "../common/helper/logger";

/**
 * One-off backfill: compute and store `matchScore` + `scoreBreakdown` for every
 * existing application so ranked applicant lists work over pre-existing data.
 * Idempotent, safe to re-run. Run with:
 *   pnpm --filter backend backfill:scores:dev
 */
const backfillScores = async () => {
  try {
    await connectDB();
    logger.info(`Connected to ${process.env.NODE_ENV} database`);

    const applications = await Application.find({}, { _id: 1 }).lean();
    logger.info(`Backfilling scores for ${applications.length} applications…`);
    let failed = 0;
    for (const app of applications) {
      try {
        await recomputeApplicationScore(String(app._id));
      } catch (error) {
        failed++;
        logger.error(`Failed to score application ${app._id}`, error);
      }
    }
    logger.info(`Application score backfill finished (${failed} failed).`);
  } catch (error) {
    logger.error("Application score backfill failed", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

backfillScores();

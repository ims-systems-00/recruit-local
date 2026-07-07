import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";
import { Job, JobProfile } from "../models";
import { recomputeJobKeywords, recomputeProfileKeywords } from "../v1/modules/job/keyword.service";
import { logger } from "../common/helper/logger";

/**
 * One-off backfill: compute and store match `keywords[]` for every existing job
 * and job profile so the `?matched=true` ranked list works over pre-existing
 * data without waiting for the next write. Computes inline (no Redis needed),
 * idempotent, safe to re-run. Run with:
 *   pnpm --filter backend backfill:keywords:dev
 */
const backfillKeywords = async () => {
  try {
    await connectDB();
    logger.info(`Connected to ${process.env.NODE_ENV} database`);

    const jobs = await Job.find({}, { _id: 1 }).lean();
    logger.info(`Backfilling keywords for ${jobs.length} jobs…`);
    for (const job of jobs) await recomputeJobKeywords(String(job._id));

    const profiles = await JobProfile.find({}, { _id: 1 }).lean();
    logger.info(`Backfilling keywords for ${profiles.length} job profiles…`);
    for (const profile of profiles) await recomputeProfileKeywords(String(profile._id));

    logger.info("Keyword backfill finished.");
  } catch (error) {
    logger.error("Keyword backfill failed", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

backfillKeywords();

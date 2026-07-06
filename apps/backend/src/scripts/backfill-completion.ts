import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";
import { JobProfile, Tenant } from "../models";
import { recomputeProfileCompletion } from "../v1/modules/job-profile/profile-completion.service";
import { recomputeTenantCompletion } from "../v1/modules/tenant/tenant-completion.service";
import { logger } from "../common/helper/logger";

/**
 * One-off backfill: compute and store `completion` for every existing job
 * profile and tenant, so they get a non-zero value without waiting for the next
 * write. Safe to re-run (recompute is idempotent). Run with:
 *   pnpm --filter backend backfill:completion:dev
 */
const backfillCompletion = async () => {
  try {
    await connectDB();
    logger.info(`Connected to ${process.env.NODE_ENV} database`);

    const profiles = await JobProfile.find({}, { userId: 1 }).lean();
    logger.info(`Backfilling completion for ${profiles.length} job profiles…`);
    for (const profile of profiles) {
      if (profile.userId) await recomputeProfileCompletion(String(profile.userId));
    }

    const tenants = await Tenant.find({}, { _id: 1 }).lean();
    logger.info(`Backfilling completion for ${tenants.length} tenants…`);
    for (const tenant of tenants) {
      await recomputeTenantCompletion(String(tenant._id));
    }

    logger.info("Completion backfill finished.");
  } catch (error) {
    logger.error("Completion backfill failed", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

backfillCompletion();

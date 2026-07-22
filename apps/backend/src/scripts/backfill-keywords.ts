import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";
import { Job, JobProfile, Post, Tenant } from "../models";
import { recomputeJobKeywords, recomputeProfileKeywords } from "../v1/modules/job/keyword.service";
import { recomputePostKeywords } from "../v1/modules/post/keyword.service";
import { recomputeTenantKeywords } from "../v1/modules/tenant/keyword.service";
import { logger } from "../common/helper/logger";

/**
 * One-off backfill: compute and store match `keywords[]` for every existing job,
 * job profile, post and tenant so the `?matched=true` lists work over pre-existing
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

    const posts = await Post.find({}, { _id: 1 }).lean();
    logger.info(`Backfilling keywords for ${posts.length} posts…`);
    for (const post of posts) await recomputePostKeywords(String(post._id));

    const tenants = await Tenant.find({}, { _id: 1 }).lean();
    logger.info(`Backfilling keywords for ${tenants.length} tenants…`);
    for (const tenant of tenants) await recomputeTenantKeywords(String(tenant._id));

    logger.info("Keyword backfill finished.");
  } catch (error) {
    logger.error("Keyword backfill failed", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

backfillKeywords();

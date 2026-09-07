import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";
import { Job } from "../models";
import { recomputeJobEmbeddingsBatch } from "../v1/modules/job/embedding.service";
import { logger } from "../common/helper/logger";

/**
 * One-off backfill: embed every job that has no vector yet, so hybrid search works
 * over pre-existing data instead of only jobs saved since the feature shipped.
 * Idempotent and resumable — it only selects jobs missing `embeddingUpdatedAt`, so
 * re-running after a failure picks up where it stopped. Run with:
 *   pnpm --filter @rl/backend backfill:embeddings:dev
 */
const BATCH_SIZE = 100;

const backfillEmbeddings = async () => {
  try {
    await connectDB();
    logger.info(`Connected to ${process.env.NODE_ENV} database`);

    const pending = await Job.find({ embeddingUpdatedAt: { $in: [null, undefined] } }, { _id: 1 }).lean();
    logger.info(`Backfilling embeddings for ${pending.length} jobs…`);

    let done = 0;
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE).map((job) => String(job._id));
      done += await recomputeJobEmbeddingsBatch(batch);
      logger.info(`  ${done}/${pending.length}`);
    }

    logger.info(`Embedding backfill finished. ${done} jobs embedded.`);
  } catch (error) {
    logger.error("Embedding backfill failed", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

backfillEmbeddings();

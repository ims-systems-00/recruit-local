import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";
import { enqueueStaleApplicationRankings } from "../queue/applicationRankingQueue";
import { RANKING_PIPELINE_VERSION } from "../v1/modules/application/ranking/pipeline";
import { logger } from "../common/helper/logger";

/**
 * One-off backfill: re-rank every application scored by a superseded pipeline.
 *
 * Adding a matcher or retuning a weight changes what a score means, so rows
 * written by an older pipeline are not comparable to new ones and a board would
 * sort the two scales against each other. Only rows whose `rankingVersion` is
 * behind the current one are touched, so re-running this straight away is
 * effectively free.
 *
 * Unlike the other backfills this one only *enqueues* — scoring happens in the
 * ranking worker, which needs Redis up and the app running to drain the queue.
 * The script returns as soon as the jobs are queued, not when they are done;
 * watch /admin/queues for progress. Run with:
 *   pnpm --filter @rl/backend rerank:applications:dev
 */
const rerankApplications = async () => {
  try {
    await connectDB();
    logger.info(`Connected to ${process.env.NODE_ENV} database`);

    logger.info(`Enqueueing applications ranked below pipeline version ${RANKING_PIPELINE_VERSION}…`);
    const enqueued = await enqueueStaleApplicationRankings();

    logger.info(
      enqueued
        ? `Enqueued ${enqueued} application(s). Watch /admin/queues for the worker to drain them.`
        : "Nothing stale — every application is already on the current pipeline."
    );
  } catch (error) {
    logger.error("Application re-rank failed", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

rerankApplications();

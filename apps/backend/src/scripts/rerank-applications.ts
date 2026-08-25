import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";
import { Application } from "../models";
import { processApplicationRanking } from "../queue/applicationRankingQueue";
import { RANKING_PIPELINE_VERSION } from "../v1/modules/application/ranking/pipeline";
import { logger } from "../common/helper/logger";

/**
 * One-off re-rank: recompute `matchScore` for every existing application under
 * the current pipeline.
 *
 * Needed whenever the pipeline changes, because nothing in the system re-ranks
 * on its own — a score is written once, when the application is created. After a
 * matcher is added or a weight retuned, existing rows still hold scores computed
 * under the old formula, and a recruiter's list would silently sort two
 * incomparable sets of numbers against each other.
 *
 * Computes inline (no Redis needed), idempotent, safe to re-run. Run with:
 *   pnpm --filter backend rerank:applications:dev
 *
 * NOTE: the ranking worker writes `matchScore` and `rank` together, seeding the
 * board order from the fresh score. Running this therefore resets `rank` on
 * every application, discarding any manual kanban ordering recruiters have done.
 * That is the worker's normal behaviour on a single application; what is new
 * here is applying it to every board at once. Confirm that is wanted before
 * running against real data.
 */
const rerankApplications = async () => {
  try {
    await connectDB();
    logger.info(`Connected to ${process.env.NODE_ENV} database`);

    const applications = await Application.find({}, { _id: 1 }).lean();
    logger.info(`Re-ranking ${applications.length} applications at pipeline v${RANKING_PIPELINE_VERSION}…`);

    let ranked = 0;
    let skipped = 0;

    for (const application of applications) {
      const result = await processApplicationRanking({ applicationId: String(application._id) });
      // An unrankable application is a normal state, not a failure — the worker
      // reports a reason rather than throwing, and the row keeps the score it had.
      if ("skipped" in result) {
        skipped += 1;
        logger.warn(`Skipped ${String(application._id)}: ${result.skipped}`);
        continue;
      }
      ranked += 1;
    }

    logger.info(`Re-rank finished. Ranked ${ranked}, skipped ${skipped}.`);
  } catch (error) {
    logger.error("Application re-rank failed", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

rerankApplications();

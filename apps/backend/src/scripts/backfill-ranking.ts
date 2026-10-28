import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";
import { Application } from "../models";
import { logger } from "../common/helper/logger";
import { RANKING_PIPELINE_VERSION } from "../v1/modules/application/ranking/pipeline";
import { rankApplication } from "../v1/modules/application/ranking/ranking.service";

/**
 * One-off backfill: re-rank every application whose `rankingVersion` is not the
 * current `RANKING_PIPELINE_VERSION` — scored by an older pipeline, or before
 * the version was recorded at all — so its `matchScore` and `matchBreakdown`
 * reflect today's matchers. New applications are ranked by the
 * application-ranking queue; this covers the ones that existed before.
 *
 * Computes inline (no Redis needed), one application at a time. `rank` is left
 * alone: the board owns it once an application is on it, and re-ranking must
 * not undo a recruiter's ordering. Soft-deleted applications are included, so
 * one restored later comes back with a current score.
 *
 * Idempotent: a re-ranked application carries the current version and is not
 * picked up again; one that could not be ranked is left for the next run.
 *
 * Dry run by default — it counts the work and writes nothing; pass --write to
 * re-rank. Run with:
 *   pnpm --filter @rl/backend backfill:ranking:dev [-- --write]
 *   pnpm --filter @rl/backend backfill:ranking:prod [-- --write]   (after a build)
 */
const backfillRanking = async () => {
  const write = process.argv.includes("--write");

  try {
    await connectDB();
    logger.info(`Connected to ${process.env.NODE_ENV} database${write ? "" : " (dry run, pass --write to re-rank)"}`);

    const stale = await Application.find({ rankingVersion: { $ne: RANKING_PIPELINE_VERSION } })
      .select("_id")
      .lean();
    logger.info(`Applications not ranked by pipeline v${RANKING_PIPELINE_VERSION}: ${stale.length}`);
    if (!write) return;

    let ranked = 0;
    const skipped: Record<string, number> = {};
    for (const { _id } of stale) {
      const outcome = await rankApplication(String(_id), { seedRank: false });
      if ("skipped" in outcome) skipped[outcome.skipped] = (skipped[outcome.skipped] ?? 0) + 1;
      else ranked++;
    }

    logger.info(`Re-ranked ${ranked} applications.`);
    if (Object.keys(skipped).length) logger.warn(`Skipped: ${JSON.stringify(skipped)}`);
  } catch (error) {
    logger.error("Ranking backfill failed", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

backfillRanking();

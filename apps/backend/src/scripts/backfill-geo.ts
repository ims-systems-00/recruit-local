import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";
import { getGeoLocationFromAddress } from "../common/helper";
import { logger } from "../common/helper/logger";
import {
  GEOCODE_SOURCES,
  GeocodeOutcome,
  GeocodeTarget,
  Geocoder,
  geocodeDocument,
} from "../v1/modules/location/geocode.service";

/**
 * One-off backfill: geocode every job's `location` and every job profile's
 * `address` into `geo`, for the distance part of job matching. Records created
 * or edited from now on are geocoded by the geocode queue; this covers the ones
 * that existed before it.
 *
 * Idempotent: a record whose current text is already geocoded is skipped, and
 * one the geocoder could not place is left for the next run. Identical text is
 * geocoded once per run, and calls are paced inside Google's rate limit.
 *
 * Dry run by default — it counts the work and makes no Google calls; pass
 * --write to geocode and save. Run with:
 *   pnpm --filter @rl/backend backfill:geo:dev [-- --write]
 */

/** Gap before each Google call: 10 a second, well inside the Geocoding API's default limit. */
const CALL_INTERVAL_MS = 100;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The Google geocoder, called once per distinct text and paced. Pacing by a
 * pause before each call holds because records are processed one at a time.
 */
const cachedGeocoder = () => {
  const cache = new Map<string, ReturnType<Geocoder>>();
  const geocode: Geocoder = (address) => {
    let result = cache.get(address);
    if (!result) {
      result = sleep(CALL_INTERVAL_MS).then(() => getGeoLocationFromAddress(address));
      cache.set(address, result);
    }
    return result;
  };
  return { geocode, calls: () => cache.size };
};

/** Records with address text not yet geocoded in its current form. */
const findPending = async (type: GeocodeTarget) => {
  const { model, field } = GEOCODE_SOURCES[type];
  const docs = await model
    .find({ [field]: { $nin: [null, ""] }, "deleteMarker.status": { $ne: true } })
    .select(`${field} geocodedFrom`)
    .lean<Record<string, unknown>[]>();

  return docs.flatMap((doc) => {
    const text = String(doc[field]).trim();
    return text && text !== doc.geocodedFrom ? [{ id: String(doc._id), text }] : [];
  });
};

const backfillGeo = async () => {
  const write = process.argv.includes("--write");

  try {
    await connectDB();
    logger.info(
      `Connected to ${process.env.NODE_ENV} database${write ? "" : " (dry run, pass --write to geocode and save)"}`
    );

    const pending = { job: await findPending("job"), profile: await findPending("profile") };
    const distinct = new Set([...pending.job, ...pending.profile].map(({ text }) => text));
    logger.info(
      `To geocode: ${pending.job.length} jobs and ${pending.profile.length} job profiles, ` +
        `${distinct.size} distinct addresses — at most ${distinct.size} Google calls.`
    );
    if (!write) return;

    const { geocode, calls } = cachedGeocoder();

    for (const type of ["job", "profile"] as const) {
      const tally: Partial<Record<GeocodeOutcome, number>> = {};
      const unplaced: string[] = [];

      for (const { id, text } of pending[type]) {
        const outcome = await geocodeDocument({ type, id }, geocode);
        tally[outcome] = (tally[outcome] ?? 0) + 1;
        // A job's location is public; a profile's address is personal, so only its id is logged.
        if (outcome === "no-result") unplaced.push(type === "job" ? `"${text}"` : id);
      }

      logger.info(`${type === "job" ? "Jobs" : "Job profiles"}: ${JSON.stringify(tally)}`);
      if (unplaced.length) logger.warn(`Could not place ${unplaced.length}: ${unplaced.join(", ")}`);
    }

    logger.info(`Geo backfill finished, ${calls()} Google calls.`);
  } catch (error) {
    logger.error("Geo backfill failed", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

backfillGeo();

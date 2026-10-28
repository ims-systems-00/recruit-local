import dotenv from "dotenv";
dotenv.config();
import { redisConnection } from "../.config/ioredis";
import { logger } from "../common/helper/logger";
import { LEGACY_FEED_KEY_MATCH, isLegacyFeedKey } from "../v1/modules/job/feed.service";

/**
 * One-off cleanup: delete the pre-v2 job feeds, `rl:jobfeed:<profileId>`.
 *
 * Those feeds were scored by keyword overlap. The feed now lives at
 * `rl:jobfeed:v2:<profileId>`, scored by match percentage, and is rebuilt the
 * first time a candidate opens the matched job list, so nothing reads the old
 * keys any more. They carry no TTL and the Redis server is shared, so left
 * alone they would stay for good.
 *
 * Only keys of exactly that shape are touched: v2 feeds and everything else
 * under the prefix are left as they are. Safe to re-run.
 *
 * Dry run by default — it counts the keys and deletes nothing; pass --write to
 * delete them. Run with:
 *   pnpm --filter @rl/backend cleanup:job-feeds:dev [-- --write]
 *   pnpm --filter @rl/backend cleanup:job-feeds:prod [-- --write]   (after a build)
 */

/** Keys Redis is asked to look at per SCAN step. A hint, not a page size. */
const SCAN_COUNT = 500;

const cleanupJobFeeds = async () => {
  const write = process.argv.includes("--write");
  const found = new Set<string>();

  try {
    logger.info(`Scanning for pre-v2 job feeds${write ? "" : " (dry run, pass --write to delete them)"}`);

    const stream = redisConnection.scanStream({ match: LEGACY_FEED_KEY_MATCH, count: SCAN_COUNT });
    for await (const batch of stream) {
      // SCAN may return a key more than once, so each is counted and deleted once.
      const fresh: string[] = [];
      for (const key of batch as string[]) {
        if (!isLegacyFeedKey(key) || found.has(key)) continue;
        found.add(key);
        fresh.push(key);
      }
      // UNLINK frees the memory off Redis' main thread. Deleting mid-SCAN is
      // safe: every key that exists for the whole scan is still returned.
      if (write && fresh.length) await redisConnection.unlink(...fresh);
    }

    logger.info(
      write ? `Deleted ${found.size} pre-v2 job feeds.` : `Found ${found.size} pre-v2 job feeds; nothing deleted.`
    );
  } catch (error) {
    logger.error("Job feed cleanup failed", error);
    process.exitCode = 1;
  } finally {
    await redisConnection.quit();
    process.exit();
  }
};

cleanupJobFeeds();

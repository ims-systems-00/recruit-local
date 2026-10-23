import assert from "assert";
import { redisConnection, REDIS_KEY_PREFIX } from "../../../.config/ioredis";

/**
 * Per-profile "matched jobs" feed, maintained by the fan-out workers.
 *
 * Stored as a Redis ZSET `rl:jobfeed:v2:{profileId}` — member = jobId, score = the
 * job's match percentage for that profile (`computeJobMatch`); keyword overlap
 * only decides which jobs are scored.
 *
 * It is a *candidate index*, not the source of truth: the jobs list constrains
 * its normal aggregation with `_id $in <feed>`, so security, soft-delete and
 * status filters still run in Mongo and any stale/closed jobs in the feed simply
 * drop out at read time (no per-mutation invalidation needed).
 */

// ponytail: cap each feed to the top matches; deep pagination isn't feed-served.
const FEED_CAP = 300;

/**
 * v2 since the score became the match percentage. The unversioned feeds held
 * keyword overlap counts, which must never sort against percentages;
 * `scripts/cleanup-job-feeds.ts` deletes them.
 */
const feedKey = (profileId: string) => `${REDIS_KEY_PREFIX}:jobfeed:v2:${profileId}`;

const LEGACY_FEED_KEY = new RegExp(`^${REDIS_KEY_PREFIX}:jobfeed:[0-9a-f]{24}$`);

/** SCAN pattern covering the pre-v2 feeds. It matches v2 feeds too, so filter with `isLegacyFeedKey`. */
export const LEGACY_FEED_KEY_MATCH = `${REDIS_KEY_PREFIX}:jobfeed:*`;

/** Whether a key is a pre-v2 feed, `rl:jobfeed:<profileId>`. */
export const isLegacyFeedKey = (key: string): boolean => LEGACY_FEED_KEY.test(key);

/** Keyword overlap count between a doc's keywords and a prebuilt set. */
export const keywordOverlap = (keywords: string[] | undefined, against: Set<string>): number =>
  (keywords ?? []).reduce((n, k) => (against.has(k) ? n + 1 : n), 0);

/** Pure top-N-by-score selection (extracted so it stays testable off Redis). */
export const topScored = <T extends { score: number }>(scored: T[], cap = FEED_CAP): T[] =>
  scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, cap);

/** Add/update one job in a profile's feed, then trim to the top FEED_CAP. */
export const addJobToFeed = async (profileId: string, jobId: string, score: number): Promise<void> => {
  if (score <= 0) return;
  const key = feedKey(profileId);
  await redisConnection.zadd(key, score, jobId);
  // Drop everything below the top FEED_CAP (ranks 0..len-CAP-1 are the lowest).
  await redisConnection.zremrangebyrank(key, 0, -(FEED_CAP + 1));
};

/** Drop one job from a profile's feed, once it no longer matches that profile. */
export const removeJobFromFeed = async (profileId: string, jobId: string): Promise<void> => {
  await redisConnection.zrem(feedKey(profileId), jobId);
};

/** Replace a profile's whole feed (used by the profile rebuild worker). */
export const rebuildFeed = async (profileId: string, scored: { jobId: string; score: number }[]): Promise<void> => {
  const key = feedKey(profileId);
  const top = topScored(scored);
  const pipeline = redisConnection.multi();
  pipeline.del(key);
  if (top.length) {
    const args: (string | number)[] = [];
    for (const { jobId, score } of top) args.push(score, jobId);
    pipeline.zadd(key, ...args);
  }
  await pipeline.exec();
};

/** Read a profile's matched job ids, best match first. */
export const readFeedIds = (profileId: string): Promise<string[]> =>
  redisConnection.zrevrange(feedKey(profileId), 0, -1);

// ponytail: single runnable check for the pure ranking logic (Redis I/O excluded).
// Run with: npx ts-node src/v1/modules/job/feed.service.ts
const demo = () => {
  const set = new Set(["react", "node", "typescript"]);
  assert(keywordOverlap(["react", "node", "go"], set) === 2, "overlap must count shared keywords");
  assert(keywordOverlap([], set) === 0, "empty keywords -> 0 overlap");

  const top = topScored([{ score: 1 }, { score: 5 }, { score: 0 }, { score: 3 }], 2);
  assert(top.length === 2 && top[0].score === 5 && top[1].score === 3, "topScored must keep highest N, drop score 0");

  const profileId = "64b7f0c2a1b2c3d4e5f60718";
  assert(isLegacyFeedKey(`rl:jobfeed:${profileId}`), "an unversioned feed is legacy");
  assert(!isLegacyFeedKey(feedKey(profileId)), "a v2 feed is not legacy");
  assert(!isLegacyFeedKey("rl:jobfeed:not-an-id") && !isLegacyFeedKey("rl:postfeed:" + profileId), "only feed ids");

  console.log("feed self-check ok");
  // Importing this module opens the shared Redis socket; exit before its async
  // retry noise so the pure-logic check runs standalone without a live Redis.
  process.exit(0);
};

if (require.main === module) demo();

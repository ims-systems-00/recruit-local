import assert from "assert";
import { redisConnection } from "../../../.config/ioredis";
import { keywordOverlap, topScored } from "../job/feed.service";

/**
 * Per-recipient "matched posts" feed, maintained by the post fan-out workers.
 *
 * Stored as a Redis ZSET — member = postId, score = keyword overlap count. Posts
 * fan out to two audiences, so keys are namespaced to keep a jobProfile id from
 * colliding with a tenant id: `postfeed:profile:{id}` and `postfeed:tenant:{id}`.
 *
 * Like the jobs feed, it is a *candidate index*, not the source of truth: the
 * posts list constrains its aggregation with `_id $in <feed>`, so security,
 * soft-delete and status filters still run in Mongo and any stale/draft posts in
 * the feed simply drop out at read time (no per-mutation invalidation needed).
 */

// ponytail: cap each feed to the top matches; deep pagination isn't feed-served.
const FEED_CAP = 300;

export const profilePostKey = (jobProfileId: string) => `postfeed:profile:${jobProfileId}`;
export const tenantPostKey = (tenantId: string) => `postfeed:tenant:${tenantId}`;

// Re-export the pure scoring helpers so callers use one implementation.
export { keywordOverlap };

/** Add/update one post in a recipient's feed, then trim to the top FEED_CAP. */
export const addPostToFeed = async (feedKey: string, postId: string, score: number): Promise<void> => {
  if (score <= 0) return;
  await redisConnection.zadd(feedKey, score, postId);
  // Drop everything below the top FEED_CAP (ranks 0..len-CAP-1 are the lowest).
  await redisConnection.zremrangebyrank(feedKey, 0, -(FEED_CAP + 1));
};

/** Replace a recipient's whole feed (used by the post-feed rebuild worker). */
export const rebuildPostFeed = async (
  feedKey: string,
  scored: { postId: string; score: number }[]
): Promise<void> => {
  const top = topScored(scored);
  const pipeline = redisConnection.multi();
  pipeline.del(feedKey);
  if (top.length) {
    const args: (string | number)[] = [];
    for (const { postId, score } of top) args.push(score, postId);
    pipeline.zadd(feedKey, ...args);
  }
  await pipeline.exec();
};

/** Read a recipient's matched post ids, best match first. */
export const readPostFeedIds = (feedKey: string): Promise<string[]> =>
  redisConnection.zrevrange(feedKey, 0, -1);

// ponytail: runnable check for the one new bit — namespaced keys must never
// collide, or a tenant would read a profile's feed. Overlap/topScored reuse the
// job feed service's own self-check. Run: npx ts-node src/v1/modules/post/feed.service.ts
const demo = () => {
  const id = "507f1f77bcf86cd799439011";
  assert(profilePostKey(id) !== tenantPostKey(id), "profile and tenant feed keys must not collide");

  const top = topScored([{ postId: "a", score: 1 }, { postId: "b", score: 5 }, { postId: "c", score: 0 }], 1);
  assert(top.length === 1 && top[0].postId === "b", "topScored must keep the highest-scored post, drop score 0");

  console.log("post feed self-check ok");
  process.exit(0);
};

if (require.main === module) demo();

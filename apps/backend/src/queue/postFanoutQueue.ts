import { Job as BullJob } from "bullmq";
import { Types } from "mongoose";
import { POST_STATUS_ENUMS } from "@rl/types";
import { ReusableQueue } from "./Queue";
import { Post, JobProfile, Tenant } from "../models";
import { addPostToFeed, keywordOverlap, profilePostKey, tenantPostKey } from "../v1/modules/post/feed.service";

export interface PostFanoutData {
  postId: string;
}

/**
 * Fan-out-on-write: when a LIVE post's keywords are (re)computed, push it into the
 * feed of every job-seeker profile AND every employer tenant that shares a keyword.
 * Runs off the request path via the keyword-update queue, so keywords are already
 * current when this fires. A post is never added to its own author's feed.
 */
const processPostFanout = async ({ postId }: PostFanoutData) => {
  if (!Types.ObjectId.isValid(postId)) return;

  const post = await Post.findById(postId).select("keywords status tenantId jobProfileId").lean();
  // Only LIVE posts are surfaced in the matched list, so only they fan out.
  if (!post || post.status !== POST_STATUS_ENUMS.LIVE) return;

  const postKeywords = post.keywords ?? [];
  if (!postKeywords.length) return;
  const kwSet = new Set(postKeywords);
  const authorProfileId = post.jobProfileId?.toString();
  const authorTenantId = post.tenantId?.toString();

  // Streamed: a popular post shouldn't load every matching recipient into memory.
  const profileCursor = JobProfile.find({ keywords: { $in: postKeywords } })
    .select("keywords")
    .lean()
    .cursor();

  for await (const profile of profileCursor) {
    // Don't surface a seeker's own post back to them in their matched feed.
    if (authorProfileId && profile._id.toString() === authorProfileId) continue;
    const score = keywordOverlap(profile.keywords, kwSet);
    if (score <= 0) continue;
    // ← notification seam: `profile` is a match recipient for this post. When
    // notifications land, enqueue a notify job for profile._id here (same set).
    await addPostToFeed(profilePostKey(profile._id.toString()), postId, score);
  }

  const tenantCursor = Tenant.find({ keywords: { $in: postKeywords } })
    .select("keywords")
    .lean()
    .cursor();

  for await (const tenant of tenantCursor) {
    if (authorTenantId && tenant._id.toString() === authorTenantId) continue;
    const score = keywordOverlap(tenant.keywords, kwSet);
    if (score <= 0) continue;
    await addPostToFeed(tenantPostKey(tenant._id.toString()), postId, score);
  }
};

export const postFanoutQueue = new ReusableQueue<PostFanoutData>("post-fanout-queue", (job: BullJob<PostFanoutData>) =>
  processPostFanout(job.data)
);

/** Fire-and-forget: fan a post out to matching profiles' and tenants' feeds. */
export const enqueuePostFanout = (postId: unknown): Promise<unknown> => {
  const id = String(postId ?? "");
  if (!Types.ObjectId.isValid(id)) return Promise.resolve();
  return postFanoutQueue.addJob("post-fanout", { postId: id });
};

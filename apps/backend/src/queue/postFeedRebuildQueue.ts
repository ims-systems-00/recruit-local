import { Job as BullJob } from "bullmq";
import { Types } from "mongoose";
import { POST_STATUS_ENUMS } from "@rl/types";
import { ReusableQueue } from "./Queue";
import { Post, JobProfile, Tenant } from "../models";
import { keywordOverlap, profilePostKey, tenantPostKey, rebuildPostFeed } from "../v1/modules/post/feed.service";

type RecipientType = "profile" | "tenant";

export interface PostFeedRebuildData {
  recipientType: RecipientType;
  recipientId: string;
}

/**
 * Rebuilds one recipient's matched-posts feed from scratch. Runs when the
 * recipient's keywords change (retro-match: pick up posts created before this
 * edit) and as the lazy build when the posts list finds an empty feed. Serves
 * both audiences — job-seeker profiles and employer tenants.
 */
const processPostFeedRebuild = async ({ recipientType, recipientId }: PostFeedRebuildData) => {
  if (!Types.ObjectId.isValid(recipientId)) return;

  const isProfile = recipientType === "profile";
  const feedKey = isProfile ? profilePostKey(recipientId) : tenantPostKey(recipientId);

  const recipient = isProfile
    ? await JobProfile.findById(recipientId).select("keywords").lean()
    : await Tenant.findById(recipientId).select("keywords").lean();
  const recipientKeywords = recipient?.keywords ?? [];
  if (!recipientKeywords.length) {
    await rebuildPostFeed(feedKey, []);
    return;
  }
  const kwSet = new Set(recipientKeywords);

  const scored: { postId: string; score: number }[] = [];
  const cursor = Post.find({
    status: POST_STATUS_ENUMS.LIVE,
    "deleteMarker.status": { $ne: true },
    keywords: { $in: recipientKeywords },
  })
    .select("keywords jobProfileId tenantId")
    .lean()
    .cursor();

  for await (const post of cursor) {
    // Keep the feed consistent with fan-out: never include the recipient's own post.
    const ownerId = recipientType === "profile" ? post.jobProfileId : post.tenantId;
    if (ownerId && ownerId.toString() === recipientId) continue;
    const score = keywordOverlap(post.keywords, kwSet);
    if (score > 0) scored.push({ postId: post._id.toString(), score });
  }

  await rebuildPostFeed(feedKey, scored);
};

export const postFeedRebuildQueue = new ReusableQueue<PostFeedRebuildData>(
  "post-feed-rebuild-queue",
  (job: BullJob<PostFeedRebuildData>) => processPostFeedRebuild(job.data)
);

const enqueue = (recipientType: RecipientType, recipientId: unknown): Promise<unknown> => {
  const id = String(recipientId ?? "");
  if (!Types.ObjectId.isValid(id)) return Promise.resolve();
  return postFeedRebuildQueue.addJob("post-feed-rebuild", { recipientType, recipientId: id });
};

/** Fire-and-forget: rebuild a job-seeker profile's matched-posts feed. */
export const enqueueProfilePostFeedRebuild = (jobProfileId: unknown) => enqueue("profile", jobProfileId);

/** Fire-and-forget: rebuild an employer tenant's matched-posts feed. */
export const enqueueTenantPostFeedRebuild = (tenantId: unknown) => enqueue("tenant", tenantId);

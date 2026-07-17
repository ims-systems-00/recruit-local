import { Types } from "mongoose";
import { ReusableQueue } from "./Queue";
import { recomputeJobKeywords, recomputeProfileKeywords } from "../v1/modules/job/keyword.service";
import { recomputePostKeywords } from "../v1/modules/post/keyword.service";
import { recomputeTenantKeywords } from "../v1/modules/tenant/keyword.service";
import { enqueueJobFanout } from "./jobFanoutQueue";
import { enqueuePostFanout } from "./postFanoutQueue";
import { enqueueProfileFeedRebuild } from "./profileFeedRebuildQueue";
import { enqueueProfilePostFeedRebuild, enqueueTenantPostFeedRebuild } from "./postFeedRebuildQueue";

export interface KeywordUpdateJobData {
  type: "job" | "profile" | "post" | "tenant";
  id: string;
}

// Fan-out chains off keyword recompute so the freshly computed keywords are what
// the fan-out matches against (avoids a race on the async recompute).
const processKeywordUpdate = async ({ type, id }: KeywordUpdateJobData) => {
  if (!id || !Types.ObjectId.isValid(id)) return;
  switch (type) {
    case "job":
      await recomputeJobKeywords(id);
      await enqueueJobFanout(id);
      return;
    case "post":
      await recomputePostKeywords(id);
      await enqueuePostFanout(id);
      return;
    case "tenant":
      // A tenant is a post recipient — retro-match posts against its new keywords.
      await recomputeTenantKeywords(id);
      await enqueueTenantPostFeedRebuild(id);
      return;
    case "profile":
      await recomputeProfileKeywords(id);
      // A profile receives both jobs and posts — rebuild both of its feeds.
      await enqueueProfileFeedRebuild(id);
      await enqueueProfilePostFeedRebuild(id);
      return;
  }
};

/**
 * Rebuilds match keywords off the request path whenever a Job, JobProfile, Post
 * or Tenant is created/updated. Feeds the `?matched=true` ranked jobs/posts lists.
 */
export const keywordUpdateQueue = new ReusableQueue<KeywordUpdateJobData>("keyword-update-queue", (job) =>
  processKeywordUpdate(job.data)
);

const enqueue = async (type: KeywordUpdateJobData["type"], id: unknown): Promise<void> => {
  if (!id) return;
  const strId = String(id);
  if (!Types.ObjectId.isValid(strId)) return;
  await keywordUpdateQueue.addJob("keyword-update", { type, id: strId });
};

/** Fire-and-forget: recompute a job's keywords after it is created/updated. */
export const enqueueJobKeywords = (jobId: unknown) => enqueue("job", jobId);

/** Fire-and-forget: recompute a job profile's keywords after it is created/updated. */
export const enqueueProfileKeywords = (jobProfileId: unknown) => enqueue("profile", jobProfileId);

/** Fire-and-forget: recompute a post's keywords after it is created/updated. */
export const enqueuePostKeywords = (postId: unknown) => enqueue("post", postId);

/** Fire-and-forget: recompute a tenant's keywords after it is created/updated. */
export const enqueueTenantKeywords = (tenantId: unknown) => enqueue("tenant", tenantId);

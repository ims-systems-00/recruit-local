import { Types } from "mongoose";
import { ReusableQueue } from "./Queue";
import { recomputeJobKeywords, recomputeProfileKeywords } from "../v1/modules/job/keyword.service";
import { enqueueJobFanout } from "./jobFanoutQueue";
import { enqueueProfileFeedRebuild } from "./profileFeedRebuildQueue";

export interface KeywordUpdateJobData {
  type: "job" | "profile";
  id: string;
}

// Fan-out chains off keyword recompute so the freshly computed keywords are what
// the fan-out matches against (avoids a race on the async recompute).
const processKeywordUpdate = async ({ type, id }: KeywordUpdateJobData) => {
  if (!id || !Types.ObjectId.isValid(id)) return;
  if (type === "job") {
    await recomputeJobKeywords(id);
    await enqueueJobFanout(id);
    return;
  }
  await recomputeProfileKeywords(id);
  await enqueueProfileFeedRebuild(id);
};

/**
 * Rebuilds match keywords off the request path whenever a Job or JobProfile is
 * created/updated. Feeds the `?matched=true` ranked jobs list.
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

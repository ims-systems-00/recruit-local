import { Types } from "mongoose";
import { ReusableQueue } from "./Queue";
import { recomputeJobKeywords, recomputeProfileKeywords } from "../v1/modules/job/keyword.service";

export interface KeywordUpdateJobData {
  type: "job" | "profile";
  id: string;
}

const processKeywordUpdate = async ({ type, id }: KeywordUpdateJobData) => {
  if (!id || !Types.ObjectId.isValid(id)) return;
  if (type === "job") return recomputeJobKeywords(id);
  return recomputeProfileKeywords(id);
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

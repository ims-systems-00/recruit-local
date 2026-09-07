import { Types } from "mongoose";
import { ReusableQueue } from "./Queue";
import { recomputeJobEmbedding } from "../v1/modules/job/embedding.service";

export interface EmbeddingUpdateJobData {
  type: "job";
  id: string;
}

const processEmbeddingUpdate = async ({ type, id }: EmbeddingUpdateJobData) => {
  if (!id || !Types.ObjectId.isValid(id)) return;
  if (type === "job") await recomputeJobEmbedding(id);
};

/**
 * Rebuilds the vector a job is found by, off the request path. An OpenAI call is
 * ~300ms and can fail — neither belongs in a recruiter's job-save request.
 */
export const embeddingUpdateQueue = new ReusableQueue<EmbeddingUpdateJobData>("embedding-update-queue", (job) =>
  processEmbeddingUpdate(job.data)
);

/** Fire-and-forget: recompute a job's embedding after it is created/updated. */
export const enqueueJobEmbedding = async (jobId: unknown): Promise<void> => {
  if (!jobId) return;
  const id = String(jobId);
  if (!Types.ObjectId.isValid(id)) return;
  await embeddingUpdateQueue.addJob("embedding-update", { type: "job", id });
};

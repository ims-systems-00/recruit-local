import { Queue, Worker, Job } from "bullmq";
import { redisConnection } from "../.config/ioredis";
import { User } from "../models";
import { feedDeliveryQueue } from "./feedDelivery";

// --- Types ---
export interface JobSnapshot {
  title?: string;
  location?: string;
}

export interface OrchestratorData {
  jobId: string;
  jobSnapshot?: JobSnapshot;
}

// --- Configuration ---
const BULLMQ_CHUNK_SIZE = 5000;

// ORCHESTRATOR QUEUE & WORKER

export const jobOrchestratorQueue = new Queue<OrchestratorData>("jobOrchestratorQueue", {
  connection: redisConnection,
});

export const jobOrchestratorWorker = new Worker<OrchestratorData>(
  "jobOrchestratorQueue",
  async (job: Job<OrchestratorData>) => {
    const { jobId, jobSnapshot } = job.data;

    // 1. Cache the snapshot ONCE globally
    if (jobSnapshot) {
      const cacheKey = `job:snapshot:${jobId}`;
      await redisConnection.hset(cacheKey, jobSnapshot);
      await redisConnection.expire(cacheKey, 60 * 60 * 24 * 30); // 30-day TTL
    }

    // todo: query users based on some rules
    const activeUserCursor = User.find({}).select("_id").lean().cursor();

    let chunk: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dispatchPromises: Promise<any>[] = [];

    // 3. Stream active users and scatter them to the Delivery Queue
    for await (const doc of activeUserCursor) {
      chunk.push(doc._id.toString());

      if (chunk.length >= BULLMQ_CHUNK_SIZE) {
        dispatchPromises.push(
          feedDeliveryQueue.add(`deliver-${jobId}-${Date.now()}`, {
            jobId,
            userIds: chunk,
          })
        );
        chunk = [];
      }
    }

    // 4. Dispatch the final partial chunk
    if (chunk.length > 0) {
      dispatchPromises.push(
        feedDeliveryQueue.add(`deliver-${jobId}-${Date.now()}`, {
          jobId,
          userIds: chunk,
        })
      );
    }

    await Promise.all(dispatchPromises);
  },
  {
    connection: redisConnection,
    lockDuration: 60000,
  }
);

jobOrchestratorWorker.on("failed", (job, err) => console.error(`Orchestrator failed for job ${job?.id}:`, err));

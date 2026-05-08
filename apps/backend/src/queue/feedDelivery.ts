import { Queue, Worker, Job } from "bullmq";
import { redisConnection } from "../.config/ioredis";

// --- Types ---
export interface DeliveryData {
  jobId: string;
  userIds: string[];
}

// --- Configuration ---
const FEED_MAX = 1000;
const REDIS_PIPELINE_BATCH = 500;

// DELIVERY QUEUE & WORKER
export const feedDeliveryQueue = new Queue<DeliveryData>("feedDeliveryQueue", {
  connection: redisConnection,
});

export const feedDeliveryWorker = new Worker<DeliveryData>(
  "feedDeliveryQueue",
  async (job: Job<DeliveryData>) => {
    const { jobId, userIds } = job.data;
    const score = Date.now().toString();

    // Process users in safe, non-blocking Redis pipelines
    for (let i = 0; i < userIds.length; i += REDIS_PIPELINE_BATCH) {
      const batch = userIds.slice(i, i + REDIS_PIPELINE_BATCH);
      const pipeline = redisConnection.pipeline();

      for (const userId of batch) {
        const key = `feed:${userId}`;
        pipeline.zadd(key, "NX", score, jobId);
        pipeline.zremrangebyrank(key, 0, -(FEED_MAX + 1));
      }

      await pipeline.exec();
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

feedDeliveryWorker.on("failed", (job, err) => console.error(`Delivery failed for job ${job?.id}:`, err));

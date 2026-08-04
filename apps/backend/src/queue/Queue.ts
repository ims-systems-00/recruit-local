/* eslint-disable @typescript-eslint/no-explicit-any */
import { Queue, Worker, Job, QueueEvents, BackoffOptions, JobsOptions } from "bullmq";
import { redisConnection, REDIS_KEY_PREFIX } from "../.config/ioredis";

/**
 * Defines the data structure for a job that lands in the DLQ.
 */
interface DeadLetterJobData {
  queueName: string;
  jobId?: string;
  jobName: string;
  data: any;
  failedReason: string;
}

const dlqName = "dead-letter-queue";

// Redis is shared with other projects, so every queue namespaces its keys under
// `rl:` rather than BullMQ's default `bull:`. Must be identical on the Queue,
// Worker and QueueEvents of a given queue or they address different key spaces.
export const deadLetterQueue = new Queue<DeadLetterJobData>(dlqName, {
  connection: redisConnection.options,
  prefix: REDIS_KEY_PREFIX,
});

/**
 * A reusable, generic class to create a BullMQ queue and worker
 * with built-in retry and DLQ logic.
 */
export class ReusableQueue<T extends object> {
  public readonly queue: Queue<T>;
  public readonly worker: Worker<T>;
  public readonly queueName: string;
  private readonly queueEvents: QueueEvents;

  constructor(queueName: string, processor: (job: Job<T>) => Promise<any>) {
    this.queueName = queueName;

    this.queue = new Queue<T>(queueName, {
      connection: redisConnection.options,
      prefix: REDIS_KEY_PREFIX,
    });

    this.worker = new Worker<T>(queueName, processor, {
      connection: redisConnection.options,
      concurrency: 5,
      prefix: REDIS_KEY_PREFIX,
    });

    this.queueEvents = new QueueEvents(queueName, {
      connection: redisConnection.options,
      prefix: REDIS_KEY_PREFIX,
    });

    this.setupCompletedJobListener();
    this.setupFailedJobListener();
  }

  private setupCompletedJobListener(): void {
    this.queueEvents.on("completed", ({ jobId }) => {
      console.log(`Job ${jobId} in queue ${this.queueName} has completed.`);
    });
  }

  private setupFailedJobListener(): void {
    this.queueEvents.on("failed", async ({ jobId, failedReason }) => {
      console.warn(`Job ${jobId} in queue ${this.queueName} has permanently failed.`);

      try {
        const job = await Job.fromId(this.queue, jobId);
        if (!job) return;

        await deadLetterQueue.add("dead-letter-job", {
          queueName: this.queueName,
          jobId: job.id,
          jobName: job.name,
          data: job.data,
          failedReason: failedReason,
        });

        console.log(`Moved failed job ${jobId} to '${dlqName}'.`);
      } catch (err) {
        console.error(`Error moving job ${jobId} to DLQ:`, err);
      }
    });
  }

  public async addJob(jobName: string, data: T, opts?: Partial<JobsOptions>): Promise<Job<T, any, string>> {
    const retryOptions: BackoffOptions = {
      type: "exponential",
      delay: 1000,
    };

    // The 'as any' casts are safe here to bypass the strict generic constraints
    return this.queue.add(jobName as any, data as any, {
      attempts: 4,
      backoff: retryOptions,
      removeOnComplete: 100,
      removeOnFail: 1000,
      ...opts,
    }) as Promise<Job<T, any, string>>;
  }
}

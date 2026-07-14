import { Job as BullJob } from "bullmq";
import { Types } from "mongoose";
import { JOBS_STATUS_ENUMS } from "@rl/types";
import { ReusableQueue } from "./Queue";
import { Job, JobProfile } from "../models";
import { addJobToFeed, keywordOverlap } from "../v1/modules/job/feed.service";

export interface JobFanoutData {
  jobId: string;
}

/**
 * Fan-out-on-write: when an OPEN job's keywords are (re)computed, push it into the
 * feed of every profile that shares a keyword. Runs off the request path via the
 * keyword-update queue, so keywords are already current when this fires.
 */
const processJobFanout = async ({ jobId }: JobFanoutData) => {
  if (!Types.ObjectId.isValid(jobId)) return;

  const job = await Job.findById(jobId).select("keywords status").lean();
  // Only OPEN jobs are surfaced in the matched list, so only they fan out.
  if (!job || job.status !== JOBS_STATUS_ENUMS.OPEN) return;

  const jobKeywords = job.keywords ?? [];
  if (!jobKeywords.length) return;
  const kwSet = new Set(jobKeywords);

  // Streamed: a popular job shouldn't load every matching profile into memory.
  const cursor = JobProfile.find({ keywords: { $in: jobKeywords } })
    .select("keywords")
    .lean()
    .cursor();

  for await (const profile of cursor) {
    const score = keywordOverlap(profile.keywords, kwSet);
    if (score <= 0) continue;
    // ← notification seam: `profile` is a match recipient for this job. When
    // notifications land, enqueue a notify job for profile._id here (same set).
    await addJobToFeed(profile._id.toString(), jobId, score);
  }
};

export const jobFanoutQueue = new ReusableQueue<JobFanoutData>("job-fanout-queue", (job: BullJob<JobFanoutData>) =>
  processJobFanout(job.data)
);

/** Fire-and-forget: fan a job out to matching profiles' feeds. */
export const enqueueJobFanout = (jobId: unknown): Promise<unknown> => {
  const id = String(jobId ?? "");
  if (!Types.ObjectId.isValid(id)) return Promise.resolve();
  return jobFanoutQueue.addJob("job-fanout", { jobId: id });
};

import { Job as BullJob } from "bullmq";
import { Types } from "mongoose";
import { JOBS_STATUS_ENUMS } from "@rl/types";
import { ReusableQueue } from "./Queue";
import { Job, JobProfile } from "../models";
import { addJobToFeed, removeJobFromFeed } from "../v1/modules/job/feed.service";
import { computeJobMatch } from "../v1/modules/job/match/job-match";
import {
  MATCH_JOB_SELECT,
  MATCH_PROFILE_POPULATE,
  MATCH_PROFILE_SELECT,
  MatchProfilePopulated,
  toMatchProfile,
} from "../v1/modules/job/match/fields";

export interface JobFanoutData {
  jobId: string;
}

/**
 * Profiles read and populated per round trip. Without a cursor `batchSize`,
 * Mongoose populates each profile's catalogue refs one document at a time.
 */
const PROFILE_BATCH_SIZE = 100;

/**
 * Fan-out-on-write: when an OPEN job's keywords are (re)computed, score it
 * against every profile that shares a keyword and write that match percentage
 * into the profile's feed. Runs off the request path via the keyword-update
 * queue, so keywords are already current when this fires.
 *
 * A profile the job no longer matches — it scores 0, or the profile has nothing
 * to compare — has the job removed, so an edit that lowers a match does not
 * leave the old score behind. A profile that stops sharing any keyword is not
 * reached here, and keeps its entry until its own feed is rebuilt.
 */
const processJobFanout = async ({ jobId }: JobFanoutData) => {
  if (!Types.ObjectId.isValid(jobId)) return;

  const job = await Job.findById(jobId).select(`keywords status ${MATCH_JOB_SELECT}`).lean();
  // Only OPEN jobs are surfaced in the matched list, so only they fan out.
  if (!job || job.status !== JOBS_STATUS_ENUMS.OPEN) return;

  const jobKeywords = job.keywords ?? [];
  if (!jobKeywords.length) return;

  // Streamed: a popular job shouldn't load every matching profile into memory.
  const cursor = JobProfile.find({ keywords: { $in: jobKeywords } })
    .select(MATCH_PROFILE_SELECT)
    .populate<MatchProfilePopulated>(MATCH_PROFILE_POPULATE)
    .lean()
    .cursor({ batchSize: PROFILE_BATCH_SIZE });

  for await (const profile of cursor) {
    const profileId = profile._id.toString();
    const score = computeJobMatch(toMatchProfile(profile), job);
    if (score === null || score <= 0) {
      await removeJobFromFeed(profileId, jobId);
      continue;
    }
    // ← notification seam: `profile` is a match recipient for this job. When
    // notifications land, enqueue a notify job for profile._id here (same set).
    await addJobToFeed(profileId, jobId, score);
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

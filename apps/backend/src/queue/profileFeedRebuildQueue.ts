import { Job as BullJob } from "bullmq";
import { Types } from "mongoose";
import { JOBS_STATUS_ENUMS } from "@rl/types";
import { ReusableQueue } from "./Queue";
import { Job, JobProfile } from "../models";
import { rebuildFeed } from "../v1/modules/job/feed.service";
import { computeJobMatch } from "../v1/modules/job/match/job-match";
import {
  MATCH_JOB_SELECT,
  MATCH_PROFILE_POPULATE,
  MATCH_PROFILE_SELECT,
  MatchProfilePopulated,
  toMatchProfile,
} from "../v1/modules/job/match/fields";

export interface ProfileFeedRebuildData {
  profileId: string;
}

/**
 * Rebuilds one profile's matched-jobs feed from scratch. Runs when the profile's
 * keywords change (retro-match: pick up jobs posted before this edit) and as the
 * lazy build when the jobs list finds an empty feed.
 *
 * Keywords pick which jobs are considered — open jobs sharing at least one with
 * the profile — and each is scored by its match percentage, the same number the
 * job list shows. A profile with nothing the matchers compare scores every job
 * `null`, and so gets an empty feed.
 */
const processProfileFeedRebuild = async ({ profileId }: ProfileFeedRebuildData) => {
  if (!Types.ObjectId.isValid(profileId)) return;

  const profile = await JobProfile.findById(profileId)
    .select(`keywords ${MATCH_PROFILE_SELECT}`)
    .populate<MatchProfilePopulated>(MATCH_PROFILE_POPULATE)
    .lean();
  const profileKeywords = profile?.keywords ?? [];
  if (!profile || !profileKeywords.length) {
    await rebuildFeed(profileId, []);
    return;
  }
  const matchProfile = toMatchProfile(profile);

  const scored: { jobId: string; score: number }[] = [];
  const cursor = Job.find({
    status: JOBS_STATUS_ENUMS.OPEN,
    "deleteMarker.status": { $ne: true },
    keywords: { $in: profileKeywords },
  })
    .select(MATCH_JOB_SELECT)
    .lean()
    .cursor();

  for await (const job of cursor) {
    const score = computeJobMatch(matchProfile, job);
    if (score !== null && score > 0) scored.push({ jobId: job._id.toString(), score });
  }

  await rebuildFeed(profileId, scored);
};

export const profileFeedRebuildQueue = new ReusableQueue<ProfileFeedRebuildData>(
  "profile-feed-rebuild-queue",
  (job: BullJob<ProfileFeedRebuildData>) => processProfileFeedRebuild(job.data)
);

/** Fire-and-forget: rebuild a profile's matched-jobs feed. */
export const enqueueProfileFeedRebuild = (profileId: unknown): Promise<unknown> => {
  const id = String(profileId ?? "");
  if (!Types.ObjectId.isValid(id)) return Promise.resolve();
  return profileFeedRebuildQueue.addJob("profile-feed-rebuild", { profileId: id });
};

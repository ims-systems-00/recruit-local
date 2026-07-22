import { Job as BullJob } from "bullmq";
import { Types } from "mongoose";
import { JOBS_STATUS_ENUMS } from "@rl/types";
import { ReusableQueue } from "./Queue";
import { Job, JobProfile } from "../models";
import { keywordOverlap, rebuildFeed } from "../v1/modules/job/feed.service";

export interface ProfileFeedRebuildData {
  profileId: string;
}

/**
 * Rebuilds one profile's matched-jobs feed from scratch. Runs when the profile's
 * keywords change (retro-match: pick up jobs posted before this edit) and as the
 * lazy build when the jobs list finds an empty feed.
 */
const processProfileFeedRebuild = async ({ profileId }: ProfileFeedRebuildData) => {
  if (!Types.ObjectId.isValid(profileId)) return;

  const profile = await JobProfile.findById(profileId).select("keywords").lean();
  const profileKeywords = profile?.keywords ?? [];
  if (!profileKeywords.length) {
    await rebuildFeed(profileId, []);
    return;
  }
  const kwSet = new Set(profileKeywords);

  const scored: { jobId: string; score: number }[] = [];
  const cursor = Job.find({
    status: JOBS_STATUS_ENUMS.OPEN,
    "deleteMarker.status": { $ne: true },
    keywords: { $in: profileKeywords },
  })
    .select("keywords")
    .lean()
    .cursor();

  for await (const job of cursor) {
    const score = keywordOverlap(job.keywords, kwSet);
    if (score > 0) scored.push({ jobId: job._id.toString(), score });
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

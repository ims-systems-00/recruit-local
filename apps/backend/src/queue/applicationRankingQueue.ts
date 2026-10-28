import { Job as BullJob } from "bullmq";
import { Types } from "mongoose";
import { ReusableQueue } from "./Queue";
import { rankApplication } from "../v1/modules/application/ranking/ranking.service";

export interface ApplicationRankingData {
  applicationId: string;
}

/**
 * Ranks an application against its job off the request path. Applying is the
 * candidate's moment and should not wait on scoring, and a job's values can
 * change long after the application landed — both are reasons the score is
 * computed here rather than inline.
 *
 * Only new applications come through here, so `rank` is seeded from the score
 * and the board opens best-match-first. The result, with the matchers' full
 * details, is the job's `returnvalue`, visible on the board at /admin/queues.
 */
export const applicationRankingQueue = new ReusableQueue<ApplicationRankingData>(
  "application-ranking-queue",
  (job: BullJob<ApplicationRankingData>) => rankApplication(job.data.applicationId, { seedRank: true })
);

/** Fire-and-forget: score one application. Ignores invalid ids. */
export const enqueueApplicationRanking = (applicationId: unknown): Promise<unknown> => {
  const id = String(applicationId ?? "");
  if (!Types.ObjectId.isValid(id)) return Promise.resolve();
  return applicationRankingQueue.addJob("application-ranking", { applicationId: id });
};

import { Job as BullJob } from "bullmq";
import { PipelineStage, Types } from "mongoose";
import { ReusableQueue } from "./Queue";
import { Application, IApplicationMatchPart, Job, JobProfile } from "../models";
import { matchQuery, excludeDeletedQuery } from "../common/query";
import { populateValuesQuery } from "../v1/modules/value/value.query";
import { populateExperienceLevelQuery } from "../v1/modules/experience-level/experience-level.query";
import { APPLICATION_MATCH_PART_ENUMS } from "@rl/types";
import {
  RANKING_PIPELINE_VERSION,
  RankingContext,
  RankingJob,
  RankingJobProfile,
  RankingResult,
  runRankingPipeline,
} from "../v1/modules/application/ranking/pipeline";
import { loadMatchProfile } from "../v1/modules/job/match/profile.service";

export interface ApplicationRankingData {
  applicationId: string;
}

/**
 * Loads a job profile by id with its `values` array populated into full value
 * documents, the same way the job-profile read path does. Soft-deleted values
 * are excluded by `populateValuesQuery`.
 *
 * `extraStages` adds what the matchers need on top — the experience level.
 */
const findWithValues = async <T>(
  model: typeof JobProfile,
  id: Types.ObjectId | string,
  extraStages: PipelineStage[] = []
): Promise<T | null> => {
  const [doc] = await model.aggregate<T>([
    ...matchQuery({ _id: new Types.ObjectId(String(id)) }),
    ...excludeDeletedQuery(),
    ...populateValuesQuery(),
    ...extraStages,
  ]);
  return doc ?? null;
};

/**
 * A result's signals in the shape `matchBreakdown` stores: each part's display
 * score, or null when it had nothing to compare and so was left out of the
 * composite. The matchers' own `details` stay in the job's `returnvalue`.
 */
const toMatchBreakdown = (result: RankingResult): IApplicationMatchPart[] =>
  result.signals.map((signal) => ({
    // Every matcher in `RANKING_PIPELINE` is keyed by its part.
    key: signal.key as APPLICATION_MATCH_PART_ENUMS,
    score: signal.applicable ? signal.score : null,
    influence: signal.influence,
  }));

/**
 * Scores one application against the job it was submitted to.
 *
 * The pipeline itself is pure and synchronous; all this does is assemble the
 * context it needs — the candidate's profile, the job, the application's own
 * screening answers, and the profile once more in the shape the job match
 * reads — and hand it over.
 *
 * The score is stored in `matchScore`, and `rank` is seeded to the same number
 * so a recruiter's board comes up best-match-first. From then on the board owns
 * `rank` — `moveToPosition` and `rebalanceColumn` rewrite it on every drag and
 * every rebalance — so the two legitimately diverge and `matchScore` is the copy
 * that survives. Each part's score goes in `matchBreakdown` beside it, for the
 * recruiter's applicant view, and `rankingVersion` records which pipeline wrote
 * them. The matchers' full details stay in the job's `returnvalue`, visible on
 * the board at /admin/queues.
 *
 * An unrankable application keeps the 0 it was created with. Those cases bail
 * out with a reason instead of throwing, since "this job lists nothing to
 * compare" is a normal state, not a failure worth retrying into the DLQ.
 */
const processApplicationRanking = async ({
  applicationId,
}: ApplicationRankingData): Promise<RankingResult | { skipped: string }> => {
  if (!Types.ObjectId.isValid(applicationId)) return { skipped: "invalid application id" };

  const application = await Application.findById(applicationId).select("jobId jobProfileId answers").lean();
  if (!application) return { skipped: "application not found" };

  const { jobId, jobProfileId } = application;
  // An application with no profile attached has no candidate side to score.
  if (!jobProfileId || !jobId) return { skipped: "application is missing jobId or jobProfileId" };

  const [jobProfile, matchProfile, job] = await Promise.all([
    findWithValues<RankingJobProfile>(JobProfile, jobProfileId, populateExperienceLevelQuery()),
    loadMatchProfile(String(jobProfileId)),
    Job.findById(jobId).lean<RankingJob>(),
  ]);

  if (!jobProfile || !matchProfile) return { skipped: "job profile not found" };
  if (!job) return { skipped: "job not found" };

  const context: RankingContext = { jobProfile, matchProfile, job, application };
  const result = runRankingPipeline(context);

  await Application.updateOne(
    { _id: application._id },
    {
      $set: {
        matchScore: result.score,
        rank: result.score,
        matchBreakdown: toMatchBreakdown(result),
        rankingVersion: RANKING_PIPELINE_VERSION,
      },
    }
  );

  return result;
};

/**
 * Ranks an application against its job off the request path. Applying is the
 * candidate's moment and should not wait on scoring, and a job's values can
 * change long after the application landed — both are reasons the score is
 * computed here rather than inline.
 */
export const applicationRankingQueue = new ReusableQueue<ApplicationRankingData>(
  "application-ranking-queue",
  (job: BullJob<ApplicationRankingData>) => processApplicationRanking(job.data)
);

/** Fire-and-forget: score one application. Ignores invalid ids. */
export const enqueueApplicationRanking = (applicationId: unknown): Promise<unknown> => {
  const id = String(applicationId ?? "");
  if (!Types.ObjectId.isValid(id)) return Promise.resolve();
  return applicationRankingQueue.addJob("application-ranking", { applicationId: id });
};

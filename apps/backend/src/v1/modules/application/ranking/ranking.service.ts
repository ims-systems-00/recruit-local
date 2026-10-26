import { PipelineStage, Types } from "mongoose";
import { APPLICATION_MATCH_PART_ENUMS } from "@rl/types";
import { Application, IApplicationMatchPart, Job, JobProfile } from "../../../../models";
import { matchQuery, excludeDeletedQuery } from "../../../../common/query";
import { populateValuesQuery } from "../../value/value.query";
import { populateExperienceLevelQuery } from "../../experience-level/experience-level.query";
import { loadMatchProfile } from "../../job/match/profile.service";
import {
  RANKING_PIPELINE_VERSION,
  RankingContext,
  RankingJob,
  RankingJobProfile,
  RankingResult,
  runRankingPipeline,
} from "./pipeline";

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
 * composite. The matchers' own `details` stay in the result.
 */
const toMatchBreakdown = (result: RankingResult): IApplicationMatchPart[] =>
  result.signals.map((signal) => ({
    // Every matcher in `RANKING_PIPELINE` is keyed by its part.
    key: signal.key as APPLICATION_MATCH_PART_ENUMS,
    score: signal.applicable ? signal.score : null,
    influence: signal.influence,
  }));

export interface RankApplicationOptions {
  /**
   * Also set `rank` to the score, so a new application lands on the board in
   * best-match order. Only for an application that has not been on a board
   * yet: from then on the board owns `rank` — `moveToPosition` and
   * `rebalanceColumn` rewrite it on every drag and every rebalance — and
   * re-ranking must leave a recruiter's ordering alone.
   */
  seedRank: boolean;
}

/**
 * Scores one application against the job it was submitted to and stores the
 * result.
 *
 * The pipeline itself is pure and synchronous; all this does is assemble the
 * context it needs — the candidate's profile, the job, the application's own
 * screening answers, and the profile once more in the shape the job match
 * reads — and hand it over.
 *
 * The score is stored in `matchScore`, which outlasts `rank` (see
 * `seedRank`). Each part's score goes in `matchBreakdown` beside it, for the
 * recruiter's applicant view, and `rankingVersion` records which pipeline wrote
 * them, so stale rankings can be found and re-ranked.
 *
 * An unrankable application keeps whatever it had. Those cases bail out with a
 * reason instead of throwing, since a missing profile or job is a normal state,
 * not a failure worth retrying into the DLQ.
 */
export const rankApplication = async (
  applicationId: string,
  { seedRank }: RankApplicationOptions
): Promise<RankingResult | { skipped: string }> => {
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
        ...(seedRank ? { rank: result.score } : {}),
        matchBreakdown: toMatchBreakdown(result),
        rankingVersion: RANKING_PIPELINE_VERSION,
      },
    }
  );

  return result;
};

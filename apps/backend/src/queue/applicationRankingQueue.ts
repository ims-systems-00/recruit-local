import { Job as BullJob } from "bullmq";
import { Types } from "mongoose";
import { ReusableQueue } from "./Queue";
import { Application, Job, JobProfile, Tenant } from "../models";
import { matchQuery, excludeDeletedQuery } from "../common/query";
import { populateValuesQuery } from "../v1/modules/value/value.query";
import {
  RankingContext,
  RankingJobProfile,
  RankingResult,
  RankingTenant,
  runRankingPipeline,
} from "../v1/modules/application/ranking/pipeline";
import { IJobInput } from "../models/job.model";

export interface ApplicationRankingData {
  applicationId: string;
}

/**
 * Loads a document by id with its `values` array populated into full value
 * documents, the same way the tenant and job-profile read paths do. Soft-deleted
 * values are excluded by `populateValuesQuery`, so a retired value cannot score.
 */
const findWithValues = async <T>(
  model: typeof JobProfile | typeof Tenant,
  id: Types.ObjectId | string
): Promise<T | null> => {
  const [doc] = await model.aggregate<T>([
    ...matchQuery({ _id: new Types.ObjectId(String(id)) }),
    ...excludeDeletedQuery(),
    ...populateValuesQuery(),
  ]);
  return doc ?? null;
};

/**
 * Scores one application against the job it was submitted to.
 *
 * The pipeline itself is pure and synchronous; all this does is assemble the
 * context it needs — the candidate's profile, the job, and the tenant that
 * posted it, with both sides' values populated — and hand it over.
 *
 * The score is stored in `matchScore`, and `rank` is seeded to the same number
 * so a recruiter's board comes up best-match-first. From then on the board owns
 * `rank` — `moveToPosition` and `rebalanceColumn` rewrite it on every drag and
 * every rebalance — so the two legitimately diverge and `matchScore` is the copy
 * that survives. Only the composite score out of `RANKING_SCALE` is stored; the
 * per-signal breakdown stays in the job's `returnvalue`, visible on the board at
 * /admin/queues.
 *
 * An unrankable application keeps the 0 it was created with. Those cases bail
 * out with a reason instead of throwing, since "this tenant set no values" is a
 * normal state, not a failure worth retrying into the DLQ.
 */
const processApplicationRanking = async ({
  applicationId,
}: ApplicationRankingData): Promise<RankingResult | { skipped: string }> => {
  if (!Types.ObjectId.isValid(applicationId)) return { skipped: "invalid application id" };

  const application = await Application.findById(applicationId).select("jobId jobProfileId tenantId").lean();
  if (!application) return { skipped: "application not found" };

  const { jobId, jobProfileId, tenantId } = application;
  // An application with no profile attached has no candidate side to score.
  if (!jobProfileId || !jobId || !tenantId)
    return { skipped: "application is missing jobId, jobProfileId or tenantId" };

  const [jobProfile, tenant, job] = await Promise.all([
    findWithValues<RankingJobProfile>(JobProfile, jobProfileId),
    findWithValues<RankingTenant>(Tenant, String(tenantId)),
    Job.findById(jobId).lean<IJobInput>(),
  ]);

  if (!jobProfile) return { skipped: "job profile not found" };
  if (!tenant) return { skipped: "tenant not found" };
  if (!job) return { skipped: "job not found" };

  const context: RankingContext = { jobProfile, job, tenant };
  const result = runRankingPipeline(context);

  await Application.updateOne({ _id: application._id }, { $set: { matchScore: result.score, rank: result.score } });

  return result;
};

/**
 * Ranks an application against its job off the request path. Applying is the
 * candidate's moment and should not wait on scoring, and a recruiter's values
 * can change long after the application landed — both are reasons the score is
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

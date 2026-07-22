import { ClientSession, Types } from "mongoose";
import { Application, Experience, Job, JobProfile, Tenant } from "../../../models";
import { AnswerValue, computeRanking, RankingContext, RankingResult } from "./ranking.core";

export * from "./ranking.core";

/** IO layer: assemble a RankingContext from Mongo, then score + persist. */

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

interface ContextParams {
  jobId: Types.ObjectId | string;
  jobProfileId?: Types.ObjectId | string;
  answers?: { queryId: Types.ObjectId | string; answer: AnswerValue }[];
  session?: ClientSession;
}

export const buildRankingContext = async ({
  jobId,
  jobProfileId,
  answers = [],
  session,
}: ContextParams): Promise<RankingContext> => {
  const job = await Job.findById(jobId)
    .select("additionalQueries yearOfExperience tenantId")
    .session(session ?? null);

  const [tenant, profile, experiences] = await Promise.all([
    job?.tenantId ? Tenant.findById(job.tenantId).select("values").session(session ?? null) : null,
    jobProfileId ? JobProfile.findById(jobProfileId).select("values").session(session ?? null) : null,
    jobProfileId ? Experience.find({ jobProfileId }).select("startDate endDate").session(session ?? null) : [],
  ]);

  const now = Date.now();
  const totalMs = (experiences ?? []).reduce((sum, e) => {
    if (!e.startDate) return sum;
    const start = new Date(e.startDate).getTime();
    const end = e.endDate ? new Date(e.endDate).getTime() : now; // ponytail: overlapping stints double-count
    return sum + Math.max(0, end - start);
  }, 0);

  return {
    jobValues: ((tenant?.values ?? []) as unknown[]).map(String),
    candidateValues: ((profile?.values ?? []) as unknown[]).map(String),
    gradableQueries: (job?.additionalQueries ?? [])
      .filter((q) => q.expectedAnswer)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((q: any) => ({ id: String(q._id), expectedAnswer: q.expectedAnswer as string, type: q.type })),
    answersByQuery: new Map(answers.map((a) => [String(a.queryId), a.answer])),
    requiredYears: job?.yearOfExperience,
    candidateYears: totalMs / MS_PER_YEAR,
  };
};

/** Recompute and persist an application's score. Used on create and by the backfill script. */
export const recomputeApplicationScore = async (
  applicationId: Types.ObjectId | string,
  session?: ClientSession
): Promise<RankingResult> => {
  const application = await Application.findById(applicationId)
    .select("jobId jobProfileId answers")
    .session(session ?? null);
  if (!application) throw new Error(`Application ${applicationId} not found`);

  const ctx = await buildRankingContext({
    jobId: application.jobId,
    jobProfileId: application.jobProfileId,
    answers: application.answers,
    session,
  });
  const result = computeRanking(ctx);

  await Application.updateOne(
    { _id: applicationId },
    { $set: { matchScore: result.matchScore, scoreBreakdown: result.breakdown } },
    { session }
  );
  return result;
};

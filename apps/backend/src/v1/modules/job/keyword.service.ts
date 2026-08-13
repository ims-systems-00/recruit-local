import { Types } from "mongoose";
import { Job } from "../../../models";
import { JobProfile } from "../../../models";
import { buildKeywords } from "../../../common/helper/keywords";

/**
 * A seeker's profile keywords, lowercased, for match ranking against
 * `Job.keywords`. Shared by the jobs list's `matched` mode and by the agent's
 * recommend_jobs tool so both score against the same vocabulary.
 *
 * Returns `[]` rather than throwing on a missing, soft-deleted or malformed id,
 * so a stale session never 404s a list that would otherwise have worked
 * unranked.
 */
export const getProfileKeywords = async (jobProfileId: string): Promise<string[]> => {
  if (!jobProfileId || !Types.ObjectId.isValid(jobProfileId)) return [];

  // Read straight off the document: the full `getOne` aggregation resolves six
  // lookups to produce a field that is a plain array of strings on the profile.
  const profile = await JobProfile.findOne({ _id: jobProfileId, "deleteMarker.status": { $ne: true } })
    .select("keywords")
    .lean();

  return (profile?.keywords ?? []).map((keyword: string) => keyword.toLowerCase());
};

/**
 * Recompute a Job's keywords[] from its own text/enum fields. Union with any
 * existing keywords so recruiter-entered tags are preserved.
 */
export const recomputeJobKeywords = async (id: string) => {
  const job = await Job.findById(id).lean();
  if (!job) return;
  const keywords = buildKeywords([job.title, job.category, job.employmentType, job.workplace, ...(job.keywords ?? [])]);
  await Job.findByIdAndUpdate(id, { $set: { keywords } });
};

/**
 * Recompute a JobProfile's keywords[]. The profile stores its strongest match
 * signals as catalog refs (jobTitle/industry/workMode), so resolve them to names
 * first — that is what lets a profile intersect a job whose fields are free text.
 */
export const recomputeProfileKeywords = async (id: string) => {
  const profile = await JobProfile.findById(id)
    .populate<{ jobTitle: { name?: string }[]; industry: { name?: string }[]; workMode: { name?: string }[] }>([
      { path: "jobTitle", select: "name" },
      { path: "industry", select: "name" },
      { path: "workMode", select: "name" },
    ])
    .lean();
  if (!profile) return;

  const refNames = [...(profile.jobTitle ?? []), ...(profile.industry ?? []), ...(profile.workMode ?? [])].map(
    (ref) => ref?.name
  );

  const keywords = buildKeywords([...refNames, profile.skills, profile.interests, ...(profile.keywords ?? [])]);
  await JobProfile.findByIdAndUpdate(id, { $set: { keywords } });
};

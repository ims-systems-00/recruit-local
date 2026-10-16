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
 * Recompute a Job's keywords[] from its own text/enum fields and its skills.
 * Union with any existing keywords so recruiter-entered tags are preserved.
 *
 * Skills are catalogue refs, so they are resolved to names first — the same move
 * as a profile's refs below — which is what lets a job's skills meet a profile's
 * in the shared vocabulary. A hard-deleted entry populates as null and simply
 * adds nothing.
 */
export const recomputeJobKeywords = async (id: string) => {
  const job = await Job.findById(id)
    .populate<{ skills: { skill: { name?: string } | null }[] }>({ path: "skills.skill", select: "name" })
    .lean();
  if (!job) return;

  const skillNames = (job.skills ?? []).map((row) => row.skill?.name);

  const keywords = buildKeywords([
    job.title,
    job.category,
    job.employmentType,
    job.workplace,
    ...skillNames,
    ...(job.keywords ?? []),
  ]);
  await Job.findByIdAndUpdate(id, { $set: { keywords } });
};

/**
 * Recompute a JobProfile's keywords[]. The profile stores its strongest match
 * signals as catalog refs (jobTitle/industry/workMode, and each skill row's
 * `skill`), so resolve them to names first — that is what lets a profile
 * intersect a job whose fields are free text.
 */
export const recomputeProfileKeywords = async (id: string) => {
  const profile = await JobProfile.findById(id)
    .populate<{
      jobTitle: { name?: string }[];
      industry: { name?: string }[];
      workMode: { name?: string }[];
      skills: { skill: { name?: string } | null }[];
    }>([
      { path: "jobTitle", select: "name" },
      { path: "industry", select: "name" },
      { path: "workMode", select: "name" },
      { path: "skills.skill", select: "name" },
    ])
    .lean();
  if (!profile) return;

  const refNames = [...(profile.jobTitle ?? []), ...(profile.industry ?? []), ...(profile.workMode ?? [])].map(
    (ref) => ref?.name
  );

  // A hard-deleted catalogue entry populates as null and adds nothing. A profile
  // not yet migrated still holds the old free-text string, which is skipped.
  const skillNames = Array.isArray(profile.skills) ? profile.skills.map((row) => row.skill?.name) : [];

  const keywords = buildKeywords([...refNames, ...skillNames, profile.interests, ...(profile.keywords ?? [])]);
  await JobProfile.findByIdAndUpdate(id, { $set: { keywords } });
};

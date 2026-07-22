import { Job } from "../../../models";
import { JobProfile } from "../../../models";
import { buildKeywords } from "../../../common/helper/keywords";

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

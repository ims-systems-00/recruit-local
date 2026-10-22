import { Types } from "mongoose";
import { JobProfile } from "../../../../models";
import { MatchProfile } from "./job-match";

/**
 * The candidate's side of a job match, read once per request.
 *
 * Read straight off the document rather than through the job-profile `getOne`
 * aggregation, which resolves half a dozen lookups this does not need. Only the
 * fields the matchers compare are selected — `valueScores` without its answers
 * and feedback text. The catalogue refs are resolved to names, since names are
 * what gets compared: job titles and industries against a job's title and
 * category, work modes against its `workplace`. `geo` is the geocoded address,
 * for distance; it stays server-side like the rest of this.
 *
 * Returns `null` rather than throwing on a missing, soft-deleted or malformed
 * id, so a stale session lists jobs without a match instead of failing.
 */
export const loadMatchProfile = async (jobProfileId?: string): Promise<MatchProfile | null> => {
  if (!jobProfileId || !Types.ObjectId.isValid(jobProfileId)) return null;

  const profile = await JobProfile.findOne({ _id: jobProfileId, "deleteMarker.status": { $ne: true } })
    .select("skills values valueScores.value valueScores.score jobTitle industry interests workMode geo")
    .populate<{
      jobTitle: { name?: string }[];
      industry: { name?: string }[];
      workMode: { name?: string }[];
    }>([
      { path: "jobTitle", select: "name" },
      { path: "industry", select: "name" },
      { path: "workMode", select: "name" },
    ])
    .lean();

  if (!profile) return null;

  const names = (refs: { name?: string }[] | undefined) => (refs ?? []).map((ref) => ref?.name);

  return {
    skills: profile.skills,
    values: profile.values,
    valueScores: profile.valueScores,
    jobTitles: names(profile.jobTitle),
    industries: names(profile.industry),
    interests: profile.interests,
    workModes: names(profile.workMode),
    geo: profile.geo,
  };
};

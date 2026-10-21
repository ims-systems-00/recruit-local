import { Types } from "mongoose";
import { JobProfile } from "../../../../models";
import { MatchProfile } from "./job-match";

/**
 * The candidate's side of a job match, read once per request.
 *
 * Read straight off the document rather than through the job-profile `getOne`
 * aggregation, which resolves half a dozen lookups this does not need. Only the
 * fields the matchers compare are selected — `valueScores` without its answers
 * and feedback text — and the work-mode refs are resolved to names, which is
 * what the location matcher compares against a job's `workplace`. `geo` is the
 * geocoded address, for distance; it stays server-side like the rest of this.
 *
 * Returns `null` rather than throwing on a missing, soft-deleted or malformed
 * id, so a stale session lists jobs without a match instead of failing.
 */
export const loadMatchProfile = async (jobProfileId?: string): Promise<MatchProfile | null> => {
  if (!jobProfileId || !Types.ObjectId.isValid(jobProfileId)) return null;

  const profile = await JobProfile.findOne({ _id: jobProfileId, "deleteMarker.status": { $ne: true } })
    .select("skills values valueScores.value valueScores.score workMode geo")
    .populate<{ workMode: { name?: string }[] }>({ path: "workMode", select: "name" })
    .lean();

  if (!profile) return null;

  return {
    skills: profile.skills,
    values: profile.values,
    valueScores: profile.valueScores,
    workModes: (profile.workMode ?? []).map((mode) => mode?.name),
    geo: profile.geo,
  };
};

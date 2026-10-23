import { Types } from "mongoose";
import { JobProfile } from "../../../../models";
import { MatchProfile } from "./job-match";
import { MATCH_PROFILE_POPULATE, MATCH_PROFILE_SELECT, MatchProfilePopulated, toMatchProfile } from "./fields";

/**
 * The candidate's side of a job match, read once per request.
 *
 * Read straight off the document rather than through the job-profile `getOne`
 * aggregation, which resolves half a dozen lookups this does not need. Which
 * fields are read and how they are shaped lives in `./fields.ts`, shared with
 * the feed workers.
 *
 * Returns `null` rather than throwing on a missing, soft-deleted or malformed
 * id, so a stale session lists jobs without a match instead of failing.
 */
export const loadMatchProfile = async (jobProfileId?: string): Promise<MatchProfile | null> => {
  if (!jobProfileId || !Types.ObjectId.isValid(jobProfileId)) return null;

  const profile = await JobProfile.findOne({ _id: jobProfileId, "deleteMarker.status": { $ne: true } })
    .select(MATCH_PROFILE_SELECT)
    .populate<MatchProfilePopulated>(MATCH_PROFILE_POPULATE)
    .lean();

  return profile ? toMatchProfile(profile) : null;
};

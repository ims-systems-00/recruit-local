import { Types } from "mongoose";
import { JobProfile, Experience, Education, Skill, Certification, CV } from "../../../models";
import { PROFILE_COMPLETION_SECTIONS, CV_STATUS_ENUM, StoredCompletion } from "@rl/types";
import { computeCompletion } from "@rl/utils";

const filledStr = (v: unknown): boolean => typeof v === "string" && v.trim().length > 0;
const filledArr = (v: unknown): boolean => Array.isArray(v) && v.length > 0;
// A catalog reference (ObjectId) counts as filled whenever it is present.
const filledRef = (v: unknown): boolean => v != null && String(v).trim().length > 0;

/**
 * Recompute and persist the completion of a candidate's job profile.
 *
 * Completion spans the JobProfile document, the user's photo, and several
 * related collections (experience/education/skills/certifications/CV), so this
 * is the single place those inputs are gathered. It is called synchronously by
 * the job-profile service on its own writes, and asynchronously (via
 * profileCompletionUpdateQueue) when a related record changes.
 *
 * Returns the lean stored completion, or null if the user has no job profile yet.
 * Callers that need the labelled breakdown expand it via `expandCompletion`.
 */
export const recomputeProfileCompletion = async (
  userId: string | Types.ObjectId
): Promise<StoredCompletion | null> => {
  if (!userId || !Types.ObjectId.isValid(userId)) return null;
  const uid = new Types.ObjectId(userId);

  const jobProfile = await JobProfile.findOne({ userId: uid });
  if (!jobProfile) return null;

  // Active (not soft-deleted) records owned by this user.
  const activeFilter = { userId: uid, "deleteMarker.status": { $ne: true } };

  const [experienceCount, educationCount, skillCount, certificationCount, cvDoc] = await Promise.all([
    Experience.countDocuments(activeFilter),
    Education.countDocuments(activeFilter),
    Skill.countDocuments(activeFilter),
    Certification.countDocuments(activeFilter),
    CV.findOne({
      ...activeFilter,
      $or: [{ status: CV_STATUS_ENUM.PUBLISHED }, { resumeId: { $ne: null } }],
    }).select("_id"),
  ]);

  const complete: Record<string, boolean> = {
    basics:
      filledStr(jobProfile.name) &&
      filledStr(jobProfile.email) &&
      filledStr(jobProfile.contactNumber) &&
      filledStr(jobProfile.address) &&
      filledStr(jobProfile.summary),
    career:
      filledArr(jobProfile.jobTitle) &&
      filledArr(jobProfile.industry) &&
      filledArr(jobProfile.workMode) &&
      filledRef(jobProfile.experienceLevel),
    photo: filledRef(jobProfile.profileImageId),
    experience: experienceCount > 0,
    education: educationCount > 0,
    skills: skillCount >= 3 || filledStr(jobProfile.skills),
    cv: Boolean(cvDoc),
    certifications: certificationCount > 0,
    values: filledArr(jobProfile.values),
    languages: filledArr(jobProfile.languages),
  };

  const { percentage, completeSections } = computeCompletion(
    PROFILE_COMPLETION_SECTIONS.map((s) => ({ key: s.key, weight: s.weight, complete: Boolean(complete[s.key]) }))
  );

  const computedAt = new Date();
  const completion: StoredCompletion = { percentage, completeSections, computedAt };
  await JobProfile.updateOne({ _id: jobProfile._id }, { $set: { completion } });

  return completion;
};

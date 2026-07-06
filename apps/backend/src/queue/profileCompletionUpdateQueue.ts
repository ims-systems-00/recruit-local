import { Types } from "mongoose";
import { ReusableQueue } from "./Queue";
import { recomputeProfileCompletion } from "../v1/modules/job-profile/profile-completion.service";

export interface ProfileCompletionUpdateJobData {
  userId: string;
}

const processProfileCompletionUpdate = async (userId: string) => {
  if (!userId || !Types.ObjectId.isValid(userId)) return;
  await recomputeProfileCompletion(userId);
};

/**
 * Recomputes a candidate's profile completion off the request path. Enqueued by
 * the experience/education/skill/certification/cv/user services whenever a
 * record that feeds completion changes.
 */
export const profileCompletionUpdateQueue = new ReusableQueue<ProfileCompletionUpdateJobData>(
  "profile-completion-update-queue",
  (job) => processProfileCompletionUpdate(job.data.userId)
);

/**
 * Convenience used by the related-record services (experience, education,
 * skill, certification, cv, user) to schedule a recompute for a user. Silently
 * ignores missing/invalid ids so callers can fire-and-forget.
 */
export const enqueueProfileCompletion = async (userId: unknown): Promise<void> => {
  if (!userId) return;
  const id = String(userId);
  if (!Types.ObjectId.isValid(id)) return;
  await profileCompletionUpdateQueue.addJob("profile-completion-update", { userId: id });
};

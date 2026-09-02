import { Job as BullJob } from "bullmq";
import { Types } from "mongoose";
import { ReusableQueue } from "./Queue";
import { Application, Favourite } from "../models";
import { modelNames } from "../models/constants";
import { logger } from "../common/helper";
import * as FileMediaService from "../v1/modules/file-media/file-media.service";

export interface JobCleanupJobData {
  jobId: string;
  mode: "soft" | "hard";
}

// A favourite points at a job by (itemId, itemType), not by a jobId field.
const favouriteQuery = (jobId: string) => ({ itemId: jobId, itemType: modelNames.JOB });

const softCleanup = async (jobId: string) => {
  const [applications, favourites] = await Promise.all([
    Application.softDelete({ jobId }),
    Favourite.softDelete(favouriteQuery(jobId)),
  ]);

  logger.info(
    `[jobCleanupQueue] job ${jobId}: soft-deleted ${applications.deleted} applications, ${favourites.deleted} favourites`
  );
};

const hardCleanup = async (jobId: string) => {
  // Deliberately not filtered by deleteMarker — the job is gone for good, so
  // applications that were already in the trash go with it.
  const applications = await Application.find({ jobId }).select("resumeId caseStudyId").lean();

  const fileIds: Types.ObjectId[] = [];
  for (const application of applications) {
    if (application.resumeId) fileIds.push(application.resumeId);
    if (Array.isArray(application.caseStudyId)) fileIds.push(...application.caseStudyId);
  }

  // One bad file must not strand the rest of the cleanup on a retry loop.
  for (const fileId of fileIds) {
    try {
      await FileMediaService.hardDelete({ query: { _id: fileId.toString() } });
    } catch (error) {
      logger.error(`[jobCleanupQueue] failed to delete file ${fileId} of job ${jobId}`, error);
    }
  }

  const [deletedApplications, deletedFavourites] = await Promise.all([
    Application.deleteMany({ jobId }),
    Favourite.deleteMany(favouriteQuery(jobId)),
  ]);

  logger.info(
    `[jobCleanupQueue] job ${jobId}: hard-deleted ${deletedApplications.deletedCount} applications, ${deletedFavourites.deletedCount} favourites, ${fileIds.length} files`
  );
};

const processJobCleanup = async ({ jobId, mode }: JobCleanupJobData) => {
  if (!jobId || !Types.ObjectId.isValid(jobId)) return;
  return mode === "hard" ? hardCleanup(jobId) : softCleanup(jobId);
};

/**
 * Cascades a job deletion off the request path: every application to the job and
 * every favourite of it follow the job into the trash (soft) or out of the
 * database (hard, including the applicants' resume and case-study files).
 */
export const jobCleanupQueue = new ReusableQueue<JobCleanupJobData>(
  "job-cleanup-queue",
  (job: BullJob<JobCleanupJobData>) => processJobCleanup(job.data)
);

/** Fire-and-forget: clean up a job's applications and favourites after it is deleted. */
export const enqueueJobCleanup = async (jobId: unknown, mode: JobCleanupJobData["mode"]): Promise<void> => {
  const strId = String(jobId ?? "");
  if (!Types.ObjectId.isValid(strId)) return;
  await jobCleanupQueue.addJob(`job-cleanup-${mode}`, { jobId: strId, mode });
};

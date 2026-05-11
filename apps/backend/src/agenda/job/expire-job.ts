import { agenda } from "../config";
import { JOB_NAME } from "../constants";
import { JOBS_STATUS_ENUMS } from "@rl/types";
import { logger } from "../../common/helper";
import type { Job as AgendaJob } from "agenda";
import * as jobService from "../../v1/modules/job/job.service";

export const defineExpireJob = () => {
  agenda.define(JOB_NAME.EXPIRE_JOB_POST, async (agendaJob: AgendaJob<{ jobId: string }>) => {
    const { jobId } = agendaJob.attrs.data;

    try {
      const jobPost = await jobService.getOne({
        query: { _id: jobId },
      });

      if (!jobPost) {
        logger.info(`Job ${jobId} not found. It may have been deleted.`);
        return;
      }

      // Double-check that the end date has actually passed
      // (in case the end date was updated after scheduling)
      if (jobPost.endDate && new Date() >= new Date(jobPost.endDate)) {
        // Update to your specific "Closed" or "Expired" enum value
        await jobService.update({
          query: { _id: jobId },
          payload: { status: JOBS_STATUS_ENUMS.CLOSED },
        });

        logger.info(`Successfully expired Job post: ${jobId}`);
      } else {
        logger.info(`Job ${jobId} end date was extended. Skipping expiration.`);
      }
    } catch (error) {
      logger.error(`Failed to expire job post ${jobId}:`, error);
      throw error;
    }
  });
};

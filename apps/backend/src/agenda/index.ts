import { logger } from "../common/helper";
import { Express } from "express";
import { agenda } from "./config";
import { defineExpireJob } from "./job/expire-job";
import { defineDevAutoVerifyKycJob } from "./job/dev-auto-verify-kyc";
import { definePurgeAgentConversationsJob, schedulePurgeAgentConversationsJob } from "./job/purge-agent-conversations";

export const setupAgenda = (app: Express) => {
  logger.info("Setting up Agenda", app.name);

  defineExpireJob();
  definePurgeAgentConversationsJob();

  if (process.env.NODE_ENV === "development") {
    defineDevAutoVerifyKycJob();
  }

  agenda
    .start()
    .then(async () => {
      logger.info("Agenda started");
      // Recurring jobs must be scheduled after start; `every` is idempotent on
      // the job name, so restarts do not stack up duplicates.
      await schedulePurgeAgentConversationsJob();
    })
    .catch((err) => {
      logger.error("Error starting Agenda", err);
    });
};

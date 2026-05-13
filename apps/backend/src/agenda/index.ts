import { logger } from "../common/helper";
import { Express } from "express";
import { agenda } from "./config";
import { defineExpireJob } from "./job/expire-job";
import { defineDevAutoVerifyKycJob } from "./job/dev-auto-verify-kyc";

export const setupAgenda = (app: Express) => {
  logger.info("Setting up Agenda", app.name);

  defineExpireJob();

  if (process.env.NODE_ENV === "development") {
    defineDevAutoVerifyKycJob();
  }

  agenda
    .start()
    .then(() => {
      logger.info("Agenda started");
    })
    .catch((err) => {
      logger.error("Error starting Agenda", err);
    });
};

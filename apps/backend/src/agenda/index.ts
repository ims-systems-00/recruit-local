import { logger } from "../common/helper";
import { Express } from "express";
import { agenda } from "./config";
import { scheduleQuotationJob } from "./schedule-quotation-job";

export const setupAgenda = (app: Express) => {
  logger.info("Setting up Agenda", app.name);
  agenda
    .start()
    .then(() => {
      logger.info("Agenda started");
      scheduleQuotationJob(agenda);
    })
    .catch((err) => {
      logger.error("Error starting Agenda", err);
    });
};

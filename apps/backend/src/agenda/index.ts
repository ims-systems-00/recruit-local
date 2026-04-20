import { logger } from "../common/helper";
import { Express } from "express";
import { agenda } from "./config";
import { defineExpireJob } from "./job/expire-job";

export const setupAgenda = (app: Express) => {
  logger.info("Setting up Agenda", app.name);

  defineExpireJob();
  agenda
    .start()
    .then(() => {
      logger.info("Agenda started");
    })
    .catch((err) => {
      logger.error("Error starting Agenda", err);
    });
};

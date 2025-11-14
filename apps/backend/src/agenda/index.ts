import { logger } from "../common/helper";
import { Express } from "express";
import { agenda } from "./config";

export const setupAgenda = (app: Express) => {
  logger.info("Setting up Agenda", app.name);
  agenda
    .start()
    .then(() => {
      logger.info("Agenda started");
    })
    .catch((err) => {
      logger.error("Error starting Agenda", err);
    });
};

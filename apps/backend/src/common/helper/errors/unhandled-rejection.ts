import { Server } from "http";
import { logger } from "../logger";

const actionOnUnhandled = (server: Server): void => {
  process.on("uncaughtException", () => {
    logger.on("error", () => {
      process.exit(1);
    });
  });

  process.on("unhandledRejection", () => {
    logger.on("error", () => {
      server.close(() => {
        process.exit(1);
      });
    });
  });
};

export { actionOnUnhandled };

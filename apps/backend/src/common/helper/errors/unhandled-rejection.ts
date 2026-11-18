import { logger } from "../logger";

// log and keep running instead of exiting
const actionOnUnhandled = (): void => {
  process.on("unhandledRejection", (reason) => {
    logger.error(`unhandledRejection: ${reason instanceof Error ? reason.stack : String(reason)}`);
  });
};

export { actionOnUnhandled };

import dotenv from "dotenv";
dotenv.config();

import { app } from "./app";
import { logger, actionOnUnhandled } from "./common/helper";
import { connectDB } from "./.config/database";
import { initiate } from "./automation/database-plugins";

// initiate database plugins
initiate();

// Connect to database
connectDB().then((connectionInstance) => {
  logger.info(`DB host [${connectionInstance.connection.host}] connection successful!`);
});

const PORT = process.env.PORT || 9027;

const server = app.listen(PORT, () => {
  logger.info(`API is listening in [${process.env.NODE_ENV}]. port ${PORT}, pid ${process.pid}`);
});

// Handle unhandled exceptions and rejections
actionOnUnhandled(server);

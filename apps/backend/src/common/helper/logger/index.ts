import developmentLogger from "./development";
import productionLogger from "./production";
export let logger = developmentLogger; // default is set as development logger
if (process.env.NODE_ENV === "development") logger = developmentLogger;
if (process.env.NODE_ENV === "production") logger = productionLogger;

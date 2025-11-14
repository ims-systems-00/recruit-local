import dotenv from "dotenv";
import { connectDB } from "../src/.config/database";
dotenv.config();
import { importTenantsFromJson, IMPORT_FLAG as TENANT_IMPORT_FLAG } from "./import-tenants-json";
import { importTasksFromJson, IMPORT_FLAG as TASK_IMPORT_FLAG } from "./import-tasks-json";

connectDB().then(async (connectionInstance) => {
  // console.log("use a collection to insert this dataset");
  const commandFlag = process.argv[2];
  switch (commandFlag) {
    case TENANT_IMPORT_FLAG:
      console.log("Starting tenants import...");
      await importTenantsFromJson();
      break;
    case TASK_IMPORT_FLAG:
      console.log("Starting tasks import...");
      await importTasksFromJson();
      break;
    default:
      console.error(`Unknown command: ${commandFlag}`);
      break;
  }

  await connectionInstance.connection.close();
});

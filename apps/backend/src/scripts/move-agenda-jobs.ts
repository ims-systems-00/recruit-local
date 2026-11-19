import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";
import { logger } from "../common/helper/logger";
import { AGENDA_COLLECTION } from "../agenda/constants";

// One-off: copies waiting Agenda jobs from the old default db (test) into the app db.
// Dry run unless --write; --from <db> to change the source. Stop the backend first.
//   pnpm --filter @rl/backend move-agenda-jobs:dev [-- --write]
//   pnpm --filter @rl/backend move-agenda-jobs:prod [-- --write]   (after a build)
const argValue = (flag: string) => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
};

const moveAgendaJobs = async () => {
  const write = process.argv.includes("--write");
  const from = argValue("--from") ?? "test";

  try {
    await connectDB();
    const target = mongoose.connection.db;
    if (!target) throw new Error("No database handle after connecting");
    if (target.databaseName === from) throw new Error(`Source and target are the same database: ${from}`);

    logger.info(
      `Copying waiting Agenda jobs from [${from}] to [${target.databaseName}]${write ? "" : " (dry run, pass --write to copy)"}`
    );

    const source = mongoose.connection.getClient().db(from).collection(AGENDA_COLLECTION);
    // recurring jobs get re-created on start, copying them would double up
    const waiting = await source.find({ nextRunAt: { $ne: null }, type: { $ne: "single" } }).toArray();

    const byName: Record<string, number> = {};
    for (const job of waiting) byName[job.name] = (byName[job.name] ?? 0) + 1;
    logger.info(`Waiting jobs in [${from}]: ${waiting.length} ${JSON.stringify(byName)}`);
    if (!write || !waiting.length) return;

    const result = await target.collection(AGENDA_COLLECTION).bulkWrite(
      waiting.map(({ _id, ...job }) => ({
        updateOne: {
          filter: { _id },
          update: { $setOnInsert: { ...job, lockedAt: null } },
          upsert: true,
        },
      }))
    );

    logger.info(`Copied ${result.upsertedCount}; ${waiting.length - result.upsertedCount} were already there.`);
  } catch (error) {
    logger.error("Agenda job move failed", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

moveAgendaJobs();

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { PROMPT_LABEL } from "@rl/types";
import { connectDB } from "../.config/database";
import { Prompt } from "../models";
import { logger } from "../common/helper/logger";
import { PROMPT_DEFAULTS } from "../seeders/prompt.seeder";
import * as promptService from "../v1/modules/prompt/prompt.service";

/**
 * Publishes the in-code prompt defaults to the prompt registry.
 *
 * The seeder only ever writes v1 and never touches an existing prompt, so once a
 * database is seeded, editing `DEFAULT_*_PROMPT` in code changes nothing at
 * runtime — the stored `production` version wins. This closes that gap without
 * hand-pasting multi-paragraph prompts into JSON, where one bad escape ships
 * broken instructions silently.
 *
 * For each prompt:
 * - text identical to `production` → skipped, nothing written;
 * - text identical to an existing newer version (a previous run created it but
 *   stopped before publishing) → `production` moved onto that version, no
 *   duplicate created;
 * - otherwise → a new version is appended and `production` moved onto it.
 *
 * Goes through `prompt.service` rather than writing the collection, so version
 * allocation, the `latest` label and the transactions are exactly what the API
 * does. Running API servers keep their resolved prompt cached for up to
 * `PROMPT_CACHE_TTL_MS` (60s by default) before they pick the change up.
 *
 * Usage:
 *   pnpm --filter @rl/backend prompts:publish:dev                   publish every changed prompt
 *   pnpm --filter @rl/backend prompts:publish:dev -- --dry-run      show what would change, write nothing
 *   pnpm --filter @rl/backend prompts:publish:dev -- --only agent.system.base,agent.system.candidate
 *   pnpm --filter @rl/backend prompts:publish:dev -- --rollback agent.system.candidate=1
 */

interface IArgs {
  dryRun: boolean;
  only: Set<string> | null;
  rollback: { name: string; version: number } | null;
}

const parseArgs = (argv: string[]): IArgs => {
  const valueOf = (flag: string) => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };

  const only = valueOf("--only");
  const rollback = valueOf("--rollback");

  let parsedRollback: IArgs["rollback"] = null;
  if (rollback) {
    const [name, version] = rollback.split("=");
    if (!name || !Number.isInteger(Number(version)) || Number(version) < 1) {
      throw new Error(`--rollback expects name=version, e.g. agent.system.candidate=1 (got "${rollback}")`);
    }
    parsedRollback = { name, version: Number(version) };
  }

  return {
    dryRun: argv.includes("--dry-run"),
    only: only ? new Set(only.split(",").map((name) => name.trim())) : null,
    rollback: parsedRollback,
  };
};

type Outcome = "published" | "relabelled" | "unchanged" | "not-seeded";

const findProduction = (name: string) =>
  Prompt.findOne({ name, labels: PROMPT_LABEL.PRODUCTION, "deleteMarker.status": { $ne: true } })
    .select("version content")
    .lean();

const rollbackPrompt = async ({ name, version }: { name: string; version: number }, dryRun: boolean) => {
  const production = await findProduction(name);
  const target = await Prompt.findOne({ name, version, "deleteMarker.status": { $ne: true } })
    .select("version")
    .lean();

  if (!target) throw new Error(`"${name}" has no version ${version}.`);

  logger.info(`${name}: production v${production?.version ?? "none"} → v${version}${dryRun ? " (dry run)" : ""}`);
  if (!dryRun) await promptService.setLabel({ name, label: PROMPT_LABEL.PRODUCTION, version } as never);
};

const publishPrompt = async (
  { name, content }: { name: string; content: string },
  dryRun: boolean
): Promise<{ outcome: Outcome; from?: number; to?: number }> => {
  const exists = await Prompt.exists({ name });
  if (!exists) return { outcome: "not-seeded" };

  const production = await findProduction(name);
  if (production?.content === content)
    return { outcome: "unchanged", from: production.version, to: production.version };

  // A version already holding this exact text — typically left by a run that
  // created it and then failed to move the label. Reuse it rather than
  // appending a duplicate.
  const existing = await Prompt.findOne({ name, content, "deleteMarker.status": { $ne: true } })
    .sort({ version: -1 })
    .select("version")
    .lean();

  if (existing) {
    if (!dryRun) {
      await promptService.setLabel({ name, label: PROMPT_LABEL.PRODUCTION, version: existing.version } as never);
    }
    return { outcome: "relabelled", from: production?.version, to: existing.version };
  }

  if (dryRun) return { outcome: "published", from: production?.version };

  const created = await promptService.create({
    payload: { name, content, commitMessage: "Published from the in-code default by prompts:publish." },
  } as never);

  await promptService.setLabel({ name, label: PROMPT_LABEL.PRODUCTION, version: created.version } as never);

  return { outcome: "published", from: production?.version, to: created.version };
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));

  await connectDB();
  logger.info(
    `Connected to the ${process.env.DATABASE_NAME} database${args.dryRun ? " — DRY RUN, nothing will be written" : ""}`
  );

  if (args.rollback) {
    await rollbackPrompt(args.rollback, args.dryRun);
    return;
  }

  if (args.only) {
    const known = new Set(PROMPT_DEFAULTS.map((prompt) => prompt.name as string));
    const unknown = [...args.only].filter((name) => !known.has(name));
    if (unknown.length) throw new Error(`Unknown prompt name(s): ${unknown.join(", ")}`);
  }

  const targets = PROMPT_DEFAULTS.filter((prompt) => !args.only || args.only.has(prompt.name));

  // Sequential: each publish is its own transaction on the same unique indexes.
  for (const prompt of targets) {
    const { outcome, from, to } = await publishPrompt(prompt, args.dryRun);
    const arrow = to ? `v${from ?? "none"} → v${to}` : from ? `v${from} → new version` : "";

    switch (outcome) {
      case "unchanged":
        logger.info(`${prompt.name}: up to date (production v${from})`);
        break;
      case "not-seeded":
        logger.warn(`${prompt.name}: not in the registry — run the prompt seeder first. Skipped.`);
        break;
      default:
        logger.info(
          `${prompt.name}: ${args.dryRun ? "would publish" : outcome} ${arrow}` +
            (!args.dryRun && from ? `   (undo: -- --rollback ${prompt.name}=${from})` : "")
        );
    }
  }
};

run()
  .catch((error) => {
    logger.error(`Prompt publish failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());

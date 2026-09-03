import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";
import { Job } from "../models";
import { EMBEDDING_DIMENSIONS } from "../common/helper/embedding";
import { JOB_SEARCH_INDEX, JOB_VECTOR_INDEX } from "../v1/modules/job/job.query";
import { logger } from "../common/helper/logger";

/**
 * Creates the two Atlas indexes hybrid job search needs. Atlas-only — these stages
 * do not exist on a self-hosted mongod, so this will fail against the local
 * docker container by design. Safe to re-run; existing indexes are left alone.
 */

/**
 * $rankFusion is part of the 8.0 release family. On some 8.0.x deployments it sits
 * behind a flag that support enables; Atlas 8.0.30 has it on already. Verified by
 * running the stage, not by reading the version — hence the probe below.
 */
const MIN_MAJOR = 8;
const MIN_MINOR = 0;

const searchIndex = {
  name: JOB_SEARCH_INDEX,
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        title: { type: "string" },
        description: { type: "string" },
        location: { type: "string" },
        category: { type: "string" },
        // Filter fields: narrow the candidate set inside the search stage so the
        // security $match afterwards is not left with a handful of rows.
        status: { type: "token" },
        tenantId: { type: "objectId" },
      },
    },
  },
};

const vectorIndex = {
  name: JOB_VECTOR_INDEX,
  type: "vectorSearch",
  definition: {
    fields: [
      { type: "vector", path: "embedding", numDimensions: EMBEDDING_DIMENSIONS, similarity: "cosine" },
      { type: "filter", path: "status" },
      { type: "filter", path: "tenantId" },
    ],
  },
};

/**
 * Actually run $rankFusion rather than infer support from the version string.
 * Version alone is not the answer: the stage ships in the 8.0 family but can be
 * flag-gated on a given deployment, so the only reliable check is to execute it.
 * Uses $sort inputs so it tests the stage and not the search indexes.
 */
const checkRankFusion = async () => {
  const info = await mongoose.connection.db!.admin().serverInfo();
  const [major, minor] = String(info.version).split(".").map(Number);
  logger.info(`MongoDB ${info.version}`);

  if (major < MIN_MAJOR || (major === MIN_MAJOR && minor < MIN_MINOR)) {
    logger.error(
      `$rankFusion needs MongoDB ${MIN_MAJOR}.${MIN_MINOR}+. Hybrid search will not run on ${info.version}.`
    );
    return false;
  }

  try {
    await Job.aggregate([
      {
        $rankFusion: {
          input: {
            pipelines: {
              a: [{ $sort: { createdAt: -1 } }, { $limit: 1 }],
              b: [{ $sort: { _id: 1 } }, { $limit: 1 }],
            },
          },
        },
      },
      { $limit: 1 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);
    logger.info("$rankFusion: available.");
    return true;
  } catch (error) {
    logger.error(
      "$rankFusion is not available on this deployment. Atlas support can enable it on 8.0.x; " +
        "until then search falls back to keyword-only.",
      error
    );
    return false;
  }
};

const ensureSearchIndexes = async () => {
  try {
    await connectDB();
    await checkRankFusion();

    const existing = (await Job.listSearchIndexes()).map((index) => index.name);

    for (const index of [searchIndex, vectorIndex]) {
      if (existing.includes(index.name)) {
        logger.info(`${index.name} already exists — skipping.`);
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await Job.createSearchIndex(index as any);
      logger.info(`${index.name} created.`);
    }

    // createSearchIndex returns before the index is queryable. Until it reports
    // READY, searches come back empty rather than erroring — which looks like a
    // bug in the pipeline if you do not know to wait.
    logger.info("Waiting for indexes to reach READY (can take a few minutes)…");
    for (let attempt = 0; attempt < 60; attempt++) {
      const indexes = await Job.listSearchIndexes();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const states = indexes.map((index) => `${index.name}=${(index as any).status}`);
      logger.info(`  ${states.join(" ")}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (indexes.every((index) => (index as any).status === "READY")) break;
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }

    logger.info("Search indexes ready.");
  } catch (error) {
    logger.error("Search index setup failed", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

ensureSearchIndexes();

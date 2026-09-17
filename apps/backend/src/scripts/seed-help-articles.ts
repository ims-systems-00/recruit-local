import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../.config/database";
import { helpArticleSeeder } from "../seeders/help-article.seeder";
import { logger } from "../common/helper/logger";

/**
 * Seeds the help corpus on its own, without running any other seeder.
 *
 * `pnpm seed:dev` runs every seeder in the file — users, values, job titles,
 * industries, prompts — which is the right thing on a fresh database and an
 * alarming thing to point at a populated one just to correct a typo in an
 * article. The help corpus is the seeder most likely to be re-run, because
 * editing `help-articles.content.ts` and reseeding *is* how an article is
 * changed, so it gets an entry point that does only that.
 *
 * Safe to re-run: the seeder upserts by slug, removes articles no longer in the
 * file, and rebuilds the text index.
 *
 *   pnpm --filter @rl/backend seed:help:dev
 */
const seedHelpArticles = async () => {
  try {
    await connectDB();
    logger.info(`Connected to the ${process.env.DATABASE_NAME} database`);

    await helpArticleSeeder();
  } catch (error) {
    logger.error("Error seeding help articles", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedHelpArticles();

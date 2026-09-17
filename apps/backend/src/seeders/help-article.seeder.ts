import { HelpArticle } from "../models";
import { logger } from "../common/helper/logger";
import { HELP_ARTICLES } from "./help-articles.content";

/**
 * Seeds the help corpus.
 *
 * Upserts by slug rather than skipping what already exists — the opposite of
 * `promptSeeder`, and deliberately so. A prompt version is something a human
 * published and must never be clobbered by a deploy; a help article has exactly
 * one source of truth, `help-articles.content.ts`, so a reseed that left stale
 * text in place would mean the file and the database disagree about what the
 * product does. Editing the file and reseeding is the intended way to correct
 * an article.
 *
 * Articles removed from the file are deleted, for the same reason: documentation
 * for a feature that no longer exists is worse than none, and the agent would
 * happily quote it.
 */
export const helpArticleSeeder = async () => {
  try {
    await Promise.all(
      HELP_ARTICLES.map((article) => HelpArticle.updateOne({ slug: article.slug }, { $set: article }, { upsert: true }))
    );

    const slugs = HELP_ARTICLES.map((article) => article.slug);
    const { deletedCount } = await HelpArticle.deleteMany({ slug: { $nin: slugs } });

    // `syncIndexes` rather than relying on autoIndex: the weighted text index is
    // what the search tool runs on, and a seeded corpus with no index behind it
    // is a tool that silently returns nothing. Changing the weights also needs
    // the old index dropped, which only syncIndexes does.
    await HelpArticle.syncIndexes();

    logger.info(`Help article seeding completed. ${HELP_ARTICLES.length} upserted, ${deletedCount} removed.`);
  } catch (error) {
    logger.error("Error seeding help articles", error);
  }
};

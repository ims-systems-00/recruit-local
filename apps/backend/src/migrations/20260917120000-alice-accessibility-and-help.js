/**
 * Adds the accessibility preferences subdocument to existing users, and builds
 * the text index the help search runs on.
 *
 * Both halves support the assistant's new capabilities: the preferences decide
 * how it words an answer and whether replies are read aloud, and the index is
 * what `search_help` queries when someone asks how the platform works.
 *
 * The values written here must match `DEFAULT_ACCESSIBILITY_PREFERENCES` in
 * `packages/types/src/accessibility.ts`. They are duplicated rather than
 * imported because migrate-mongo runs plain CommonJS against the database with
 * no TypeScript build in the picture — so if that constant changes, this file
 * does not follow it, and only new users would get the new default.
 *
 * Writing the document rather than leaving it absent is the point of the
 * migration. Mongoose applies a subdocument default only when the whole object
 * is missing, so a later `$set` of one preference on an untouched user would
 * leave every other field undefined instead of defaulted.
 *
 * Idempotent: the filter only matches users who have no preferences yet, so
 * re-running never overwrites a choice somebody made.
 */
const DEFAULT_ACCESSIBILITY = {
  plainLanguage: false,
  answerLength: "normal",
  oneQuestionAtATime: false,
  autoReadAloud: false,
  voice: null,
  speechRate: 1,
};

const HELP_TEXT_INDEX = "help_article_text";

module.exports = {
  async up(db) {
    await db
      .collection("users")
      .updateMany({ accessibility: { $exists: false } }, { $set: { accessibility: DEFAULT_ACCESSIBILITY } });

    // Weights mirror `help-article.model.ts`. Title outranks keywords so an exact
    // title match wins; body is weighted down to 1 so a long article cannot beat
    // a short, precise one on term frequency alone.
    await db
      .collection("helparticles")
      .createIndex(
        { title: "text", keywords: "text", summary: "text", body: "text" },
        { weights: { title: 10, keywords: 8, summary: 4, body: 1 }, name: HELP_TEXT_INDEX }
      );

    await db.collection("helparticles").createIndex({ slug: 1 }, { unique: true });
  },

  async down(db) {
    await db.collection("users").updateMany({}, { $unset: { accessibility: "" } });

    // Tolerated rather than awaited blindly: `down` is often run against a
    // database where the seeder never ran, so the collection and its indexes may
    // not exist. Failing there would block the rest of the rollback.
    try {
      await db.collection("helparticles").dropIndex(HELP_TEXT_INDEX);
      await db.collection("helparticles").dropIndex({ slug: 1 });
    } catch {
      // No index to drop.
    }
  },
};

/**
 * Gives every existing job profile an empty `valueScores` array, the shape new
 * profiles get from the schema default.
 *
 * Nothing breaks without it — the evaluate endpoint `$push`es onto a missing
 * array just as well — but aggregation reads bypass Mongoose defaults, so an
 * old profile would otherwise come back with no `valueScores` key at all while a
 * new one has `[]`, and every reader would have to handle both.
 *
 * The questions themselves are not added here: they are catalog content that
 * lives in `seeders/value-assessments.content.ts`, which a plain-CommonJS
 * migration cannot import. They reach an existing database through
 * `pnpm seed:value-assessments`.
 *
 * Idempotent: the filter only matches profiles without the field.
 */
module.exports = {
  async up(db) {
    await db.collection("jobprofiles").updateMany({ valueScores: { $exists: false } }, { $set: { valueScores: [] } });
  },

  async down(db) {
    await db.collection("jobprofiles").updateMany({}, { $unset: { valueScores: "" } });
  },
};

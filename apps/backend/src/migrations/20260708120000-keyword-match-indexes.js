/**
 * Builds the `keywords` indexes that back the keyword-match fan-out:
 *   - jobs.keywords        -> profile feed rebuild queries jobs by keyword $in
 *   - jobprofiles.keywords -> job fan-out queries profiles by keyword $in
 *
 * Dev builds these via mongoose autoIndex; this migration covers existing/prod
 * data. Idempotent — createIndex is a no-op when the index already exists.
 */
module.exports = {
  async up(db) {
    await db.collection("jobs").createIndex({ keywords: 1 });
    await db.collection("jobprofiles").createIndex({ keywords: 1 });
  },

  async down(db) {
    await db.collection("jobs").dropIndex({ keywords: 1 });
    await db.collection("jobprofiles").dropIndex({ keywords: 1 });
  },
};

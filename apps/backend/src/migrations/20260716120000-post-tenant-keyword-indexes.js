/**
 * Builds the `keywords` indexes that back the post keyword-match fan-out:
 *   - posts.keywords   -> feed rebuild queries posts by keyword $in
 *   - tenants.keywords -> post fan-out queries tenants by keyword $in
 *
 * (jobprofiles.keywords already exists from the job fan-out migration; the post
 * fan-out reuses it for the profile audience.)
 *
 * Dev builds these via mongoose autoIndex; this migration covers existing/prod
 * data. Idempotent — createIndex is a no-op when the index already exists.
 */
module.exports = {
  async up(db) {
    await db.collection("posts").createIndex({ keywords: 1 });
    await db.collection("tenants").createIndex({ keywords: 1 });
  },

  async down(db) {
    await db.collection("posts").dropIndex({ keywords: 1 });
    await db.collection("tenants").dropIndex({ keywords: 1 });
  },
};

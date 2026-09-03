/**
 * Marks every existing job as un-embedded so `backfill:embeddings` has something
 * to select on. The vectors themselves are written by that script, not here — a
 * migration must not depend on an external API being reachable.
 */
module.exports = {
  async up(db) {
    await db
      .collection("jobs")
      .updateMany({ embeddingUpdatedAt: { $exists: false } }, { $set: { embeddingUpdatedAt: null } });
  },

  async down(db) {
    await db.collection("jobs").updateMany({}, { $unset: { embedding: "", embeddingUpdatedAt: "" } });
  },
};

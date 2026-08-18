/**
 * Stamps every application with the ranking pipeline that produced its score.
 *
 * `RANKING_PIPELINE_VERSION` has always documented itself as being written onto
 * each stored ranking, but nothing ever wrote it, so there was no way to tell a
 * fresh score from one an older pipeline produced. That mattered the moment the
 * pipeline gained the skills matcher: the weights went from 2/1/1 to 2/2/1/1, so
 * every score written before it is on a different scale and a board sorting the
 * two against each other is comparing nothing.
 *
 * Backfill is 0, not the current version — "scored by a pipeline we can no
 * longer name". Claiming otherwise would mark stale rows as current and they
 * would never be picked up. 0 also matches the schema default, so an application
 * created but never successfully ranked reads the same as one ranked long ago:
 * both need a pass, which is exactly what `enqueueStaleApplicationRankings`
 * selects on.
 *
 * This migration does not re-rank. Scoring needs the queue, Redis and the
 * matchers, none of which are reachable from migrate-mongo's raw driver — run
 * the backfill from the app afterwards.
 *
 * Also adds the index that backfill query rides. Dev builds it via mongoose
 * autoIndex; this covers existing/prod data. Idempotent — createIndex is a no-op
 * when the index already exists, and the update is filtered on the field being
 * absent.
 */
module.exports = {
  async up(db) {
    await db
      .collection("applications")
      .updateMany({ rankingVersion: { $exists: false } }, { $set: { rankingVersion: 0 } });

    await db.collection("applications").createIndex({ rankingVersion: 1 });
  },

  async down(db) {
    await db.collection("applications").dropIndex({ rankingVersion: 1 });
    await db.collection("applications").updateMany({}, { $unset: { rankingVersion: "" } });
  },
};

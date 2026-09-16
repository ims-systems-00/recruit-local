/**
 * Backfills `tenantId` on statuses from their parent job.
 *
 * CASL scopes statuses on `tenantId` (see `@rl/authz` status.authz). Statuses
 * created before that have none, so an employer would lose every column on
 * their existing boards. New statuses get it on create.
 *
 * Only job statuses are touched — jobs are the only parent that carries a tenant.
 * Idempotent: re-running rewrites the same value. Also builds the board index.
 */
module.exports = {
  async up(db) {
    const jobs = db.collection("jobs").find({ tenantId: { $ne: null } }, { projection: { tenantId: 1 } });

    let ops = [];
    for await (const job of jobs) {
      ops.push({
        updateMany: {
          filter: { collectionName: "jobs", collectionId: job._id },
          update: { $set: { tenantId: job.tenantId } },
        },
      });

      if (ops.length === 500) {
        await db.collection("statuses").bulkWrite(ops, { ordered: false });
        ops = [];
      }
    }
    if (ops.length) await db.collection("statuses").bulkWrite(ops, { ordered: false });

    await db.collection("statuses").createIndex({ tenantId: 1, collectionName: 1, collectionId: 1 });
  },

  async down(db) {
    await db.collection("statuses").dropIndex({ tenantId: 1, collectionName: 1, collectionId: 1 });
    await db.collection("statuses").updateMany({}, { $unset: { tenantId: "" } });
  },
};

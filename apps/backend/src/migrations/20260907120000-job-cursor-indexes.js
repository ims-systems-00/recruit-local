/**
 * Builds the indexes backing cursor pagination on `GET /jobs` and `GET /public/jobs`.
 *
 * The keyset walks (createdAt, _id) under the scope the security $match always
 * applies — `status` for candidates and the public list, `tenantId` for an
 * employer. Without these the keyset $match is still a collection scan, which
 * gives up the whole point of moving off $skip.
 *
 * Dev builds these via mongoose autoIndex; this migration covers existing/prod
 * data. Idempotent — createIndex is a no-op when the index already exists.
 */
module.exports = {
  async up(db) {
    await db.collection("jobs").createIndex({ status: 1, createdAt: -1, _id: -1 });
    await db.collection("jobs").createIndex({ tenantId: 1, createdAt: -1, _id: -1 });
  },

  async down(db) {
    await db.collection("jobs").dropIndex({ status: 1, createdAt: -1, _id: -1 });
    await db.collection("jobs").dropIndex({ tenantId: 1, createdAt: -1, _id: -1 });
  },
};

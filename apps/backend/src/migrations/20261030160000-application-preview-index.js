/**
 * Builds the index backing `applicantPreview` on the employer's `GET /jobs`.
 *
 * For each job on the page, the preview takes that job's newest applications
 * (sorted by appliedAt, then _id) and keeps 4. With only the single-field
 * `jobId` index, Mongo reads every application of the job to find those 4; with
 * this one it reads the 4 straight off the index, however many applied.
 *
 * Dev builds this via mongoose autoIndex; this migration covers existing/prod
 * data. Idempotent — createIndex is a no-op when the index already exists.
 */
module.exports = {
  async up(db) {
    await db.collection("applications").createIndex({ jobId: 1, appliedAt: -1, _id: -1 });
  },

  async down(db) {
    await db.collection("applications").dropIndex({ jobId: 1, appliedAt: -1, _id: -1 });
  },
};

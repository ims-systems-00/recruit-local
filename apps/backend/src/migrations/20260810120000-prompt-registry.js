/**
 * Sets up the prompt registry.
 *
 * Two unique indexes carry the invariants the registry depends on:
 *   - {name, version} — version allocation is read-then-write, so two
 *     concurrent creates can pick the same number. This index turns that into a
 *     duplicate-key error the service retries, instead of two v4s.
 *   - {name, labels}  — multikey unique, so no two versions of a prompt can
 *     carry the same label. "One `production` per prompt" therefore holds at the
 *     database level rather than in application code. The partial filter is
 *     required: Mongo indexes an empty array as a single `undefined` key, so
 *     without it the second version to lose all its labels would collide with
 *     the first.
 *
 * Also backfills the two trace fields recording which stored prompt version
 * framed a run. Both are optional and additive, so existing traces stay valid;
 * the explicit null makes "this run predates prompt versioning" distinguishable
 * from "this field was never written".
 *
 * Dev builds the indexes via mongoose autoIndex; this migration covers
 * existing/prod data. Idempotent — createIndex is a no-op when the index
 * already exists.
 */
module.exports = {
  async up(db) {
    await db.collection("prompts").createIndex({ name: 1, version: 1 }, { unique: true });
    await db
      .collection("prompts")
      .createIndex({ name: 1, labels: 1 }, { unique: true, partialFilterExpression: { labels: { $type: "string" } } });

    await db
      .collection("agenttraces")
      .updateMany({ promptName: { $exists: false } }, { $set: { promptName: null, promptVersion: null } });
  },

  async down(db) {
    await db.collection("prompts").dropIndex({ name: 1, version: 1 });
    await db.collection("prompts").dropIndex({ name: 1, labels: 1 });

    await db.collection("agenttraces").updateMany({}, { $unset: { promptName: "", promptVersion: "" } });
  },
};

/**
 * Builds the indexes backing the per-viewer signals on a post read
 * (`alreadyReacted` / `alreadySaved`), each of which $lookups by target document:
 *   - reactions.{collectionName, collectionId} -> the viewer's reaction on a post
 *   - favourites.{itemType, itemId}            -> whether the viewer saved a post
 *
 * The favourites collection already has a partial unique index leading with
 * `tenantId`, which cannot serve a candidate's query (it matches on
 * `jobProfileId` + item), hence the separate target-first index.
 *
 * Dev builds these via mongoose autoIndex; this migration covers existing/prod
 * data. Idempotent — createIndex is a no-op when the index already exists.
 */
module.exports = {
  async up(db) {
    await db.collection("reactions").createIndex({ collectionName: 1, collectionId: 1 });
    await db.collection("favourites").createIndex({ itemType: 1, itemId: 1 });
  },

  async down(db) {
    await db.collection("reactions").dropIndex({ collectionName: 1, collectionId: 1 });
    await db.collection("favourites").dropIndex({ itemType: 1, itemId: 1 });
  },
};

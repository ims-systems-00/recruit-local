/**
 * Moves sign-ins from the per-user `tokenpairs` arrays to one `sessions`
 * document per sign-in, holding token hashes only.
 *
 * Drops `tokenpairs`, so everyone signs in again once. Builds the `sessions`
 * indexes, which dev gets from mongoose autoIndex. Idempotent: createIndex is a
 * no-op when the index exists, and a missing `tokenpairs` is skipped.
 *
 * `down` drops `sessions` only. The old plaintext tokens are gone for good.
 */
module.exports = {
  async up(db) {
    const [tokenPairs] = await db.listCollections({ name: "tokenpairs" }).toArray();
    if (tokenPairs) await db.collection("tokenpairs").drop();

    const sessions = db.collection("sessions");
    await sessions.createIndex({ userId: 1 });
    await sessions.createIndex({ accessHash: 1 }, { unique: true });
    await sessions.createIndex({ refreshHash: 1 }, { unique: true });
    await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  },

  async down(db) {
    const [sessions] = await db.listCollections({ name: "sessions" }).toArray();
    if (sessions) await db.collection("sessions").drop();
  },
};

module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection("users").updateMany({ type: "internal" }, { $set: { type: "platform-admin" } });
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection("users").updateMany({ type: "platform-admin" }, { $set: { type: "internal" } });
      });
    } finally {
      await session.endSession();
    }
  },
};

module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection("tenants").updateMany({}, { $set: { status: "active" } });
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection("tenants").updateMany({}, { $unset: { status: "" } });
      });
    } finally {
      await session.endSession();
    }
  },
};

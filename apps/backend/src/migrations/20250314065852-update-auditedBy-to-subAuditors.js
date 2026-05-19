module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection("audits").updateMany({}, { $rename: { auditedBy: "subAuditors" } });
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection("audits").updateMany({}, { $rename: { subAuditors: "auditedBy" } });
      });
    } finally {
      await session.endSession();
    }
  },
};

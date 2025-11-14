module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection("cocmedias").updateMany(
          { duplicateCheck: { $exists: false } },
          {
            $set: {
              duplicateCheck: {
                status: "unique",
                image: null,
                text: null,
                url: null,
              },
            },
          }
        );
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    // No rollback needed
  },
};

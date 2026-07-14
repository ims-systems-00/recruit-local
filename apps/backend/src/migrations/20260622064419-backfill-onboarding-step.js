module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const filter = { onboardingStep: { $exists: false } };
        const set = { $set: { onboardingStep: "not_started" } };
        await db.collection("jobprofiles").updateMany(filter, set, { session });
        await db.collection("tenants").updateMany(filter, set, { session });
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const query = { onboardingStep: "not_started" };
        await db.collection("jobprofiles").updateMany(query, { $unset: { onboardingStep: "" } }, { session });
        await db.collection("tenants").updateMany(query, { $unset: { onboardingStep: "" } }, { session });
      });
    } finally {
      await session.endSession();
    }
  },
};

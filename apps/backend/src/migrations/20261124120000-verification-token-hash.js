// stores tokenHash instead of the plaintext token, drops old rows
const COLLECTION = "verificationtokens";

const hasIndex = async (collection, name) => {
  const indexes = await collection.indexes();
  return indexes.some((index) => index.name === name);
};

module.exports = {
  async up(db) {
    const [existing] = await db.listCollections({ name: COLLECTION }).toArray();
    const tokens = db.collection(COLLECTION);

    if (existing) {
      await tokens.deleteMany({});
      if (await hasIndex(tokens, "token_1")) await tokens.dropIndex("token_1");
    }

    await tokens.createIndex({ tokenHash: 1 }, { unique: true });
  },

  async down(db) {
    const [existing] = await db.listCollections({ name: COLLECTION }).toArray();
    if (!existing) return;

    const tokens = db.collection(COLLECTION);
    if (await hasIndex(tokens, "tokenHash_1")) await tokens.dropIndex("tokenHash_1");
  },
};

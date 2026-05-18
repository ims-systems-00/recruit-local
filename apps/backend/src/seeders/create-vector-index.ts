import { MongoClient } from "mongodb";
import "dotenv/config";

async function createVectorIndex() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
  const dbName = process.env.DB_NAME || process.env.DATABASE_NAME;

  if (!mongoUri) throw new Error("MONGO_URI or MONGO_URL is required");
  if (!dbName) throw new Error("DB_NAME or DATABASE_NAME is required");

  const client = new MongoClient(mongoUri);
  await client.connect();

  const db = client.db(dbName);
  const collection = db.collection("keywords");

  const indexName = process.env.KEYWORD_VECTOR_INDEX_NAME ?? "keyword_vector_index";

  try {
    await collection.createSearchIndex({
      name: indexName,
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: 1536,
            similarity: "cosine",
          },
        ],
      },
    });
    console.log(`✅ Index "${indexName}" created`);
  } catch (err: any) {
    if (err.codeName === "IndexAlreadyExists") {
      console.log(` Index "${indexName}" already exists`);
    } else {
      throw err;
    }
  }

  await client.close();
}

createVectorIndex().catch(console.error);

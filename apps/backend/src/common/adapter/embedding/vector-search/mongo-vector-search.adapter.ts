import { Collection } from "mongodb";
import { Embeddings } from "@langchain/core/embeddings";
import { IVectorSearchAdapter, IVectorSearchOptions, IVectorSearchResult } from "./vector-search.adapter.interface";

export class MongoVectorSearchAdapter implements IVectorSearchAdapter {
  async search(
    collection: Collection,
    embeddings: Embeddings,
    queryText: string,
    options: IVectorSearchOptions
  ): Promise<IVectorSearchResult[]> {
    const { indexName, textKey = "text", embeddingKey = "embedding", limit = 10 } = options;

    const queryVector = await embeddings.embedQuery(queryText);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = await (collection as any)
      .aggregate([
        {
          $vectorSearch: {
            queryVector,
            index: indexName,
            path: embeddingKey,
            limit,
            numCandidates: 10 * limit,
          },
        },
        { $set: { score: { $meta: "vectorSearchScore" } } },
        { $project: { [embeddingKey]: 0, __v: 0 } },
      ])
      .toArray();

    return results.map((doc) => ({
      _id: String(doc._id ?? ""),
      text: doc[textKey],
      score: doc.score,
      metadata: doc,
    }));
  }
}

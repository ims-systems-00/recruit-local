import { Collection } from "mongodb";
import { Embeddings } from "@langchain/core/embeddings";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { IVectorSearchAdapter, IVectorSearchOptions, IVectorSearchResult } from "./vector-search.adapter.interface";

export class MongoVectorSearchAdapter implements IVectorSearchAdapter {
  async search(
    collection: Collection,
    embeddings: Embeddings,
    queryText: string,
    options: IVectorSearchOptions
  ): Promise<IVectorSearchResult[]> {
    const { indexName, textKey = "text", embeddingKey = "embedding", limit } = options;

    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection,
      indexName,
      textKey,
      embeddingKey,
    });

    const results = await vectorStore.similaritySearchWithScore(queryText, limit);

    return results.map(([doc, score]) => ({
      _id: String(doc.metadata._id ?? ""),
      text: doc.pageContent,
      score,
      metadata: doc.metadata,
    }));
  }
}

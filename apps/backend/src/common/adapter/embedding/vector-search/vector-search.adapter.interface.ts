import { Embeddings } from "@langchain/core/embeddings";
import { Collection } from "mongodb";

export interface IVectorSearchOptions {
  indexName: string;
  textKey?: string;
  embeddingKey?: string;
  limit: number;
}

export interface IVectorSearchResult {
  _id: string;
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface IVectorSearchAdapter {
  search(
    collection: Collection,
    embeddings: Embeddings,
    queryText: string,
    options: IVectorSearchOptions
  ): Promise<IVectorSearchResult[]>;
}

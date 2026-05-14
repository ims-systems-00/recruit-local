import { Embeddings } from "@langchain/core/embeddings";

export interface IEmbeddingAdapter {
  generateEmbedding(text: string): Promise<number[]>;
  getEmbeddings(): Embeddings;
}

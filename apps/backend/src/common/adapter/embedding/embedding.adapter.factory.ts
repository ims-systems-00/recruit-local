import { IEmbeddingAdapter } from "./embedding.adapter.interface";
import { OpenAIEmbeddingAdapter } from "./openai-embedding.adapter";

export type EmbeddingProvider = "openai";

export class EmbeddingAdapterFactory {
  static create(provider: EmbeddingProvider = "openai"): IEmbeddingAdapter {
    if (provider === "openai") return new OpenAIEmbeddingAdapter();
    throw new Error(`Unknown embedding provider: ${provider}`);
  }
}

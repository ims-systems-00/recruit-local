import { createHash } from "crypto";
import OpenAI from "openai";
import { redisConnection, REDIS_KEY_PREFIX } from "../../.config/ioredis";
import { logger } from "./logger";

/**
 * Text -> vector, for Atlas Vector Search.
 *
 * Its own client rather than the agent's (`modules/agent/llm/client.ts`) or the CV
 * extractor's: those carry 60s/90s timeouts tuned for chat and PDF work, and an
 * embedding call that slow should fail the request instead of holding it open.
 * Same OPENAI_API_KEY.
 *
 * Built on first use, not at import. The OpenAI constructor throws when the key is
 * missing, and this module is reachable from the job controller — eager
 * construction would turn an unset OPENAI_API_KEY into a server that will not boot
 * rather than a search that degrades to keyword-only.
 */
let client: OpenAI | undefined;

const getClient = (): OpenAI => {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000 });
  return client;
};

export const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

/** Must match `numDimensions` in the job_vector_index definition. */
export const EMBEDDING_DIMENSIONS = 1536;

/** text-embedding-3-small caps at 8192 tokens; ~4 chars per token, cut well short. */
const MAX_INPUT_CHARS = 24_000;

const QUERY_CACHE_TTL_SECONDS = 60 * 60 * 24;

const queryCacheKey = (term: string) =>
  `${REDIS_KEY_PREFIX}:embedcache:${createHash("sha256").update(term.toLowerCase()).digest("hex")}`;

/** One vector. Returns `[]` on empty input or a failed call — callers degrade to keyword-only. */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const input = text?.trim().slice(0, MAX_INPUT_CHARS);
  if (!input) return [];

  try {
    const response = await getClient().embeddings.create({ model: EMBEDDING_MODEL, input });
    return response.data[0]?.embedding ?? [];
  } catch (error) {
    logger.error("Embedding generation failed", error);
    return [];
  }
};

/**
 * Batch variant for the backfill. One request per batch instead of one per job —
 * same token cost, far fewer round trips. Output order matches input order.
 */
export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
  const inputs = texts.map((text) => text?.trim().slice(0, MAX_INPUT_CHARS) || "");
  if (!inputs.some(Boolean)) return inputs.map(() => []);

  try {
    const response = await getClient().embeddings.create({ model: EMBEDDING_MODEL, input: inputs });
    return response.data.map((item) => item.embedding);
  } catch (error) {
    logger.error("Batch embedding generation failed", error);
    return inputs.map(() => []);
  }
};

/**
 * Search-time embedding, cached in Redis for a day.
 *
 * Without this every keystroke-debounced search is an OpenAI round trip. Popular
 * terms ("react developer") then cost one call across all users. A Redis failure
 * must not fail the search, so both sides are best-effort.
 */
export const getQueryEmbedding = async (term: string): Promise<number[]> => {
  const key = queryCacheKey(term);

  try {
    const cached = await redisConnection.get(key);
    if (cached) return JSON.parse(cached) as number[];
  } catch (error) {
    logger.warn("Query embedding cache read failed", error);
  }

  const embedding = await generateEmbedding(term);
  if (!embedding.length) return [];

  try {
    await redisConnection.set(key, JSON.stringify(embedding), "EX", QUERY_CACHE_TTL_SECONDS);
  } catch (error) {
    logger.warn("Query embedding cache write failed", error);
  }

  return embedding;
};

import OpenAI from "openai";

/**
 * The agent's LLM client.
 *
 * Separate from the CV-extraction client in cv-extract.service.ts, which has a
 * 90s timeout tuned for PDF work. Both share the same OPENAI_API_KEY.
 *
 * `baseURL` and the model are both env-driven so pointing this at a gateway
 * (OpenRouter and most others are OpenAI-API-compatible) is a config change
 * rather than a refactor. Nothing else in the agent module imports `OpenAI`
 * directly — the loop imports `llm` and `AGENT_MODEL` only.
 */
export const llm = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AGENT_LLM_BASE_URL, // undefined => api.openai.com
  timeout: 60_000,
});

export const AGENT_MODEL = process.env.AGENT_MODEL || "gpt-4o";

/**
 * In-process cache for resolved prompts.
 *
 * The agent resolves a prompt on every run, so an uncached lookup would put two
 * Mongo round trips on the critical path of every message. The cache lives in
 * the process rather than in Redis because a local Map read is free, and
 * because a prompt is small enough that duplicating it per instance costs
 * nothing.
 *
 * Consequence: an instance that did not serve the write only notices a prompt
 * change when its entry expires. `PROMPT_CACHE_TTL_MS` is therefore the
 * worst-case delay between moving a label and every instance honouring it.
 * Writes on *this* instance invalidate eagerly, so a single-instance deployment
 * sees changes immediately.
 */

export const PROMPT_CACHE_TTL_MS = parseInt(process.env.PROMPT_CACHE_TTL_MS || "60000", 10);

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const keyOf = (name: string, label?: string) => `${name}::${label ?? ""}`;

export const getCachedPrompt = <T>(name: string, label?: string): T | undefined => {
  const entry = store.get(keyOf(name, label));
  if (!entry) return undefined;

  if (Date.now() > entry.expiresAt) {
    store.delete(keyOf(name, label));
    return undefined;
  }

  return entry.value as T;
};

export const setCachedPrompt = <T>(name: string, label: string | undefined, value: T): void => {
  store.set(keyOf(name, label), { value, expiresAt: Date.now() + PROMPT_CACHE_TTL_MS });
};

/**
 * Drops every entry for a name. Label-blind on purpose: a version write or a
 * label move can change what *any* label resolves to for that prompt, and the
 * entries per name are few enough that precision would buy nothing.
 */
export const invalidatePromptCache = (name: string): void => {
  const prefix = `${name}::`;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
};

export const clearPromptCache = (): void => {
  store.clear();
};

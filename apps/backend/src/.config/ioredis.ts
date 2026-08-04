import IORedis, { RedisOptions } from "ioredis";
import { logger } from "../common/helper/logger";

/**
 * Redis connection resolution.
 *
 * Precedence: REDIS_URL -> discrete REDIS_* vars -> the Redis bundled inside the backend image.
 * When nothing is configured we fall back to 127.0.0.1:6379, which is where the container's
 * entrypoint starts redis-server.
 */

const INTERNAL_HOST = "127.0.0.1";
const DEFAULT_PORT = 6379;

/**
 * Namespace for every key this app writes. The Redis server is shared with other
 * projects, so nothing may sit on a bare key name.
 *
 * Applied two ways: as BullMQ's `prefix` option (keys become `rl:<queue>:*`
 * instead of the default `bull:<queue>:*`) and by hand in the feed key builders.
 * It deliberately is *not* set as ioredis' `keyPrefix` — BullMQ does not support
 * that option, and this connection is shared with the queues.
 */
export const REDIS_KEY_PREFIX = "rl";

function buildRedisOptions(): RedisOptions {
  // maxRetriesPerRequest must be null for BullMQ workers — keep it on every branch.
  const base: RedisOptions = { maxRetriesPerRequest: null };

  const url = process.env.REDIS_URL?.trim();
  if (url) {
    const parsed = new URL(url);
    const db = parsed.pathname.replace(/^\//, "");
    return {
      ...base,
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : DEFAULT_PORT,
      username: decodeURIComponent(parsed.username) || undefined,
      password: decodeURIComponent(parsed.password) || undefined,
      db: db ? Number(db) : undefined,
      tls: parsed.protocol === "rediss:" ? {} : undefined,
    };
  }

  return {
    ...base,
    host: process.env.REDIS_HOST?.trim() || INTERNAL_HOST,
    port: Number(process.env.REDIS_PORT) || DEFAULT_PORT,
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : undefined,
    tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  };
}

export const redisOptions: RedisOptions = buildRedisOptions();

logger.info(
  `Redis target [${redisOptions.host}:${redisOptions.port}] db=${redisOptions.db ?? 0} tls=${redisOptions.tls ? "yes" : "no"}`
);

export const redisConnection = new IORedis(redisOptions);

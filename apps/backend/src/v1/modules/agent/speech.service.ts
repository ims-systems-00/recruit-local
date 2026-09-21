import { createHash } from "crypto";
import { AccessibilityPreferences, SPEECH_RATE_MAX, SPEECH_RATE_MIN } from "@rl/types";
import { redisConnection, REDIS_KEY_PREFIX } from "../../../.config/ioredis";
import { logger } from "../../../common/helper";
import { llm } from "./llm/client";

/**
 * Text to speech, for reading the assistant's replies and the platform's own
 * questions aloud.
 *
 * Server-side rather than the browser's `speechSynthesis` because the voices
 * that API exposes are whatever the operating system happens to ship: excellent
 * on one machine, robotic or absent on the next, and different every time the
 * user switches device. For someone who relies on read-aloud rather than using
 * it occasionally, that inconsistency is the difference between a feature and a
 * lottery. The cost of that choice is real — it bills per character and adds a
 * round trip — which is what the cache below is for.
 */

/** The API's own hard limit is 4096; staying under it keeps the error ours. */
export const SPEECH_MAX_CHARS = 4_000;

const MODEL = process.env.AGENT_TTS_MODEL || "gpt-4o-mini-tts";
const DEFAULT_VOICE = process.env.AGENT_TTS_VOICE || "alloy";

/**
 * Voices the endpoint accepts.
 *
 * Listed here rather than passed through, because an unrecognised voice is a
 * 400 from the provider — a failed read-aloud for the user, and one that only
 * appears in a server log. Validating against a known set turns it into a
 * default.
 */
export const SPEECH_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"];

/**
 * Audio is cached for a day.
 *
 * Long enough to cover the case this is for — the same question read out
 * repeatedly as somebody works through a form, or a reply replayed because it
 * was missed — and short enough that a wording change is never stale for long.
 */
const CACHE_TTL_SECONDS = 24 * 60 * 60;

/** Well past any sane TTS payload; a guard against filling Redis, not a target. */
const MAX_CACHEABLE_BYTES = 1_000_000;

/**
 * Cache key.
 *
 * Namespaced under `rl:` because the Redis server is shared with other projects —
 * see Rule 3 in CLAUDE.md. Built here, in one exported-by-use builder, rather
 * than inlined at each call site.
 *
 * Keyed on the *content* of the request — text, voice, speed, model — and not on
 * the user. Identical inputs produce identical audio, so keying by user would
 * store one copy per person of the same spoken sentence, which for shared
 * platform text like an onboarding question is the entire population. The text
 * is hashed rather than embedded: it can be 4,000 characters, and a key that
 * size is its own problem.
 */
const speechKey = (text: string, voice: string, speed: number): string => {
  const digest = createHash("sha256").update(`${MODEL}|${voice}|${speed}|${text}`).digest("hex");
  return `${REDIS_KEY_PREFIX}:agentspeech:${digest}`;
};

/** Clamps to the accepted range rather than rejecting; the value is cosmetic. */
const clampSpeed = (speed?: number): number => {
  if (typeof speed !== "number" || Number.isNaN(speed)) return 1;
  return Math.min(SPEECH_RATE_MAX, Math.max(SPEECH_RATE_MIN, speed));
};

const resolveVoice = (voice?: string | null): string =>
  voice && SPEECH_VOICES.includes(voice) ? voice : DEFAULT_VOICE;

export interface ISpeechRequest {
  text: string;
  voice?: string;
  speed?: number;
  /** The caller's stored preferences, used for anything the request omits. */
  preferences?: AccessibilityPreferences;
}

export interface ISpeechResult {
  audio: Buffer;
  contentType: string;
  voice: string;
  speed: number;
  /** True when this came from Redis. Useful in a log; harmless in a header. */
  cached: boolean;
}

/**
 * Renders text as MP3.
 *
 * MP3 rather than a higher-fidelity format because every browser plays it, it is
 * small enough to cache, and speech at conversational bitrates gains nothing
 * audible from the alternatives.
 *
 * Cache failures never fail the request: a Redis outage should make read-aloud
 * more expensive, not unavailable. That is the reason for the try/catch around
 * each cache call rather than around the whole function.
 */
export const synthesize = async ({ text, voice, speed, preferences }: ISpeechRequest): Promise<ISpeechResult> => {
  // The request wins over the stored preference, which wins over the default —
  // so a one-off "read that back slower" does not silently become permanent.
  const resolvedVoice = resolveVoice(voice ?? preferences?.voice);
  const resolvedSpeed = clampSpeed(speed ?? preferences?.speechRate);

  const key = speechKey(text, resolvedVoice, resolvedSpeed);

  try {
    // Buffer-typed read: the payload is binary and `get` would decode it as
    // UTF-8, which silently corrupts it.
    const hit = await redisConnection.getBuffer(key);
    if (hit) {
      return { audio: hit, contentType: "audio/mpeg", voice: resolvedVoice, speed: resolvedSpeed, cached: true };
    }
  } catch (error) {
    logger.warn("[agent] speech cache read failed", { error: error instanceof Error ? error.message : String(error) });
  }

  const response = await llm.audio.speech.create({
    model: MODEL,
    voice: resolvedVoice,
    input: text,
    speed: resolvedSpeed,
    response_format: "mp3",
  });

  const audio = Buffer.from(await response.arrayBuffer());

  if (audio.length <= MAX_CACHEABLE_BYTES) {
    try {
      await redisConnection.set(key, audio, "EX", CACHE_TTL_SECONDS);
    } catch (error) {
      logger.warn("[agent] speech cache write failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { audio, contentType: "audio/mpeg", voice: resolvedVoice, speed: resolvedSpeed, cached: false };
};

import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import { ANSWER_LENGTH, SPEECH_RATE_MAX, SPEECH_RATE_MIN } from "@rl/types";
import { SPEECH_MAX_CHARS, SPEECH_VOICES } from "./speech.service";

const instruction = Joi.string().trim().min(1).max(4000).label("Instruction");

/**
 * `instruction` is optional here: POST /conversations with no instruction just
 * opens an empty conversation, while including one runs the first turn
 * immediately so a one-shot command stays a single HTTP call.
 */
export const createConversationBodySchema = Joi.object({
  instruction: instruction.optional(),
});

export const sendMessageBodySchema = Joi.object({
  instruction: instruction.required(),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * Both bounds optional — omitting them reports over all traces ever recorded.
 * `unknown(true)` because the shared list/query params (page, limit, sort) ride
 * along on the query string and are not this endpoint's business.
 */
export const traceStatsQuerySchema = Joi.object({
  from: Joi.date().iso().optional().label("From"),
  to: Joi.date().iso().min(Joi.ref("from")).optional().label("To"),
}).unknown(true);

/**
 * The contract for `GET /agent/conversations`.
 *
 * Joi objects reject unknown keys, which is the point: before this a typo'd param
 * became a `$match` clause and the endpoint quietly returned nothing.
 */
export const conversationListQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Removed: paging is by cursor. Accepted and dropped rather than 400'ing a
  // caller that still sends it.
  page: Joi.any().strip(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("-lastMessageAt", "lastMessageAt", "-createdAt", "createdAt").default("-lastMessageAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
});

/**
 * `POST /agent/speech`.
 *
 * `voice` and `speed` are optional because the usual call sends neither — the
 * caller's stored accessibility preferences supply both. They exist for the
 * one-off ("read that back slower"), which must not overwrite the preference.
 */
export const speechBodySchema = Joi.object({
  text: Joi.string().trim().min(1).max(SPEECH_MAX_CHARS).required().label("Text"),
  voice: Joi.string()
    .valid(...SPEECH_VOICES)
    .label("Voice"),
  speed: Joi.number().min(SPEECH_RATE_MIN).max(SPEECH_RATE_MAX).label("Speed"),
});

/**
 * `PATCH /agent/preferences`.
 *
 * Every field optional, at least one required: a PATCH that changes nothing is a
 * caller bug worth reporting rather than a no-op worth accepting.
 */
export const accessibilityBodySchema = Joi.object({
  plainLanguage: Joi.boolean().label("Plain language"),
  answerLength: Joi.string()
    .valid(...Object.values(ANSWER_LENGTH))
    .label("Answer length"),
  oneQuestionAtATime: Joi.boolean().label("One question at a time"),
  autoReadAloud: Joi.boolean().label("Read aloud automatically"),
  // `null` is how a caller clears the preference back to the server default,
  // which an absent key cannot express in a PATCH.
  voice: Joi.string()
    .valid(...SPEECH_VOICES)
    .allow(null)
    .label("Voice"),
  speechRate: Joi.number().min(SPEECH_RATE_MIN).max(SPEECH_RATE_MAX).label("Speech rate"),
})
  .min(1)
  .messages({ "object.min": "No preference was given to update." });

import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import { ANSWER_LENGTH, SPEECH_RATE_MAX, SPEECH_RATE_MIN } from "@rl/types";
import { SPEECH_MAX_CHARS, SPEECH_VOICES } from "./speech.service";

const instruction = Joi.string().trim().min(1).max(4000).label("Instruction");

/** Size caps for browser-reported page data. Bounds cost, not just shape. */
export const PAGE_STATE_MAX_CHARS = 2_000;
export const PAGE_ACTION_PARAMETERS_MAX_CHARS = 2_000;
export const PAGE_ACTIONS_MAX = 10;

/** Rejects a JSON value whose serialized form exceeds `max` characters. */
const maxSerialized = (max: number, label: string) => (value: unknown, helpers: Joi.CustomHelpers) =>
  JSON.stringify(value).length > max ? helpers.message({ custom: `${label} is too large.` }) : value;

/**
 * The page the user is on, as the browser reports it. See `AgentPageContextDto`.
 *
 * Deliberately strict on shape and size and deliberately loose on meaning: no
 * allowlist of pages, because any page may register actions and the whole point
 * is that adding one needs no backend change. That looseness is acceptable only
 * because nothing here authorizes anything — see `page-context.ts`.
 */
const pageContextSchema = Joi.object({
  page: Joi.string()
    .pattern(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/)
    .max(100)
    .required()
    .label("Page"),
  summary: Joi.string().trim().max(300).label("Page summary"),
  state: Joi.object().unknown(true).custom(maxSerialized(PAGE_STATE_MAX_CHARS, "Page state")).label("Page state"),
  actions: Joi.array()
    .items(
      Joi.object({
        name: Joi.string()
          .pattern(/^[a-z][a-z0-9_]{2,40}$/)
          .required()
          .label("Action name"),
        description: Joi.string().trim().min(1).max(500).required().label("Action description"),
        parameters: Joi.object({ type: Joi.string().valid("object").required() })
          .unknown(true)
          .custom(maxSerialized(PAGE_ACTION_PARAMETERS_MAX_CHARS, "Action parameters"))
          .required()
          .label("Action parameters"),
      })
    )
    .max(PAGE_ACTIONS_MAX)
    .unique("name")
    .label("Page actions"),
}).label("Page context");

/**
 * `instruction` is optional here: POST /conversations with no instruction just
 * opens an empty conversation, while including one runs the first turn
 * immediately so a one-shot command stays a single HTTP call.
 */
export const createConversationBodySchema = Joi.object({
  instruction: instruction.optional(),
  pageContext: pageContextSchema.optional(),
});

export const sendMessageBodySchema = Joi.object({
  instruction: instruction.required(),
  pageContext: pageContextSchema.optional(),
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

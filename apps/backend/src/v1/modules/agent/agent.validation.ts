import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

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

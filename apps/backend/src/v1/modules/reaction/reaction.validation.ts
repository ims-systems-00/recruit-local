import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import { modelNames } from "../../../models/constants";
import { ReactionType } from "@rl/types";

export const createReactionBodySchema = Joi.object({
  collectionName: Joi.string()
    .valid(...Object.values(modelNames))
    .required()
    .label("Collection Name"),
  collectionId: Joi.string().custom(objectIdValidation).required().label("Collection ID"),
  type: Joi.string()
    .valid(...Object.values(ReactionType))
    .required()
    .label("Reaction Type"),
});

export const updateReactionBodySchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(ReactionType))
    .required()
    .label("Reaction Type"),
});

export const reactionIdParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("Reaction ID"),
});

export const getReactionsQuerySchema = Joi.object({
  collectionId: Joi.string().custom(objectIdValidation).required().label("Collection ID"),
  collectionName: Joi.string()
    .valid(...Object.values(modelNames))
    .optional()
    .label("Collection Name"),
});

/**
 * The contract for `GET /reactions`.
 *
 * Joi objects reject unknown keys, which is the point: before this a typo'd param
 * became a `$match` clause and the endpoint quietly returned nothing.
 */
export const listQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page. Kept because the frontend still sends `page: … || 1`.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("-createdAt", "createdAt").default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  collectionName: Joi.string().trim().max(100),
  collectionId: Joi.string().custom(objectIdValidation),
  type: Joi.string().trim().max(100),
});

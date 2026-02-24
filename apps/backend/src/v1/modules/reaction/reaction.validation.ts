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

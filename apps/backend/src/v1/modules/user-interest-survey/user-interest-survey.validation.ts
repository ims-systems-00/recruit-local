import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

export const upsertBodySchema = Joi.object({
  interest: Joi.string().min(1).max(1000).required(),
  isSkipped: Joi.boolean().optional(),
});

export const skipBodySchema = Joi.object({
  isSkipped: Joi.boolean().valid(true).required(),
});

export const updateBodySchema = Joi.object({
  interest: Joi.string().min(1).max(1000).optional(),
  isSkipped: Joi.boolean().optional(),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

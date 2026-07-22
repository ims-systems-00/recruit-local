import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

export const createBodySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  isActive: Joi.boolean().optional(),
});

export const updateBodySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional(),
  isActive: Joi.boolean().optional(),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

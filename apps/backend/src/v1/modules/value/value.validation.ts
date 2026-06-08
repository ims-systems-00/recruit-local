import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

const VALUE_TYPES = ["mindset", "working-style", "culture", "motivation", "leadership", "communication", "impact"];

export const createBodySchema = Joi.object({
  type: Joi.string().valid(...VALUE_TYPES).required().label("Type"),
  value: Joi.string().min(2).max(200).required().label("Value"),
  isActive: Joi.boolean().optional().label("Is Active"),
});

export const updateBodySchema = Joi.object({
  type: Joi.string().valid(...VALUE_TYPES).optional().label("Type"),
  value: Joi.string().min(2).max(200).optional().label("Value"),
  isActive: Joi.boolean().optional().label("Is Active"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

import Joi from "joi";
import { VALUE_TYPE_ENUM } from "@rl/types";
import { objectIdValidation } from "../../../common/helper/validate";

export const createBodySchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(VALUE_TYPE_ENUM))
    .required()
    .label("Type"),
  label: Joi.string().min(2).max(200).required().label("Label"),
  isActive: Joi.boolean().optional().label("Is Active"),
});

export const updateBodySchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(VALUE_TYPE_ENUM))
    .optional()
    .label("Type"),
  label: Joi.string().min(2).max(200).optional().label("Label"),
  isActive: Joi.boolean().optional().label("Is Active"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

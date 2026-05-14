import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

export const createBodySchema = Joi.object({
  text: Joi.string().min(1).max(200).required(),
});

export const searchQuerySchema = Joi.object({
  query: Joi.string().min(1).required(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

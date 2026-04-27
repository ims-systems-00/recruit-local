import Joi from "joi";
import { modelNames } from "../../../models/constants";
import { objectIdValidation } from "../../../common/helper/validate";

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("Favourite ID"),
});

export const createFavouriteBodySchema = Joi.object({
  itemId: Joi.string().custom(objectIdValidation).required().label("Item ID"),
  itemType: Joi.string()
    .valid(...Object.values(modelNames))
    .required()
    .label("Favourite Type"),
});

export const updateFavouriteBodySchema = Joi.object({
  itemType: Joi.string()
    .valid(...Object.values(modelNames))
    .optional()
    .label("Favourite Type"),
});

export const favouriteListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),

  userId: Joi.string().custom(objectIdValidation).optional().label("User Filter"),

  itemId: Joi.string().custom(objectIdValidation).optional().label("Item Filter"),

  itemType: Joi.string()
    .valid(...Object.values(modelNames))
    .optional()
    .label("Type Filter"),

  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

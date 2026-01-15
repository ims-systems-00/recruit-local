import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { ITEM_TYPE_ENUMS } from "@rl/types";

const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const createFavouriteBodySchema = Joi.object({
  itemId: Joi.string().custom(objectIdValidation).required().label("Item ID"),
  itemType: Joi.string()
    .valid(...Object.values(ITEM_TYPE_ENUMS))
    .required()
    .label("Favourite Type"),
});

export const updateFavouriteBodySchema = Joi.object({
  itemType: Joi.string()
    .valid(...Object.values(ITEM_TYPE_ENUMS))
    .optional()
    .label("Favourite Type"),
});

export const favouriteListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),

  userId: Joi.string().custom(objectIdValidation).optional().label("User Filter"),

  itemId: Joi.string().custom(objectIdValidation).optional().label("Item Filter"),

  itemType: Joi.string()
    .valid(...Object.values(ITEM_TYPE_ENUMS))
    .optional()
    .label("Type Filter"),

  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { modelNames } from "../../../../models/constants";

// Custom validation for MongoDB ObjectId
const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const createBodySchema = Joi.object({
  collectionName: Joi.string()
    .valid(...Object.values(modelNames))
    .required()
    .label("Collection Name"),
  collectionId: Joi.string().custom(objectIdValidation).required().label("Collection ID"),

  title: Joi.string().required().max(50).label("Title"),
  description: Joi.string().max(255).allow("", null).label("Description"),
  theme: Joi.string().max(50).allow("", null).label("Theme"),
  collaboration: Joi.array().items(Joi.string().custom(objectIdValidation)).label("Collaboration"),
});

export const updateBodySchema = Joi.object({
  collectionName: Joi.string()
    .valid(...Object.values(modelNames))
    .label("Collection Name"),
  collectionId: Joi.string().custom(objectIdValidation).label("Collection ID"),

  title: Joi.string().max(50).label("Title"),
  description: Joi.string().max(255).allow("", null).label("Description"),
  theme: Joi.string().max(50).allow("", null).label("Theme"),
  collaboration: Joi.array().items(Joi.string().custom(objectIdValidation)).label("Collaboration"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * The contract for `GET /forms`.
 *
 * Joi objects reject unknown keys, which is the point: before this a typo'd param
 * became a `$match` clause and the endpoint quietly returned nothing.
 */
export const listQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("-createdAt", "createdAt", "title", "-title").default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  collectionName: Joi.string().trim().max(100),
  collectionId: Joi.string().hex().length(24),
  status: Joi.string().trim().max(50),
});

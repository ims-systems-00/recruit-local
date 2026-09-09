import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";

// Custom validation for MongoDB ObjectId
const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const createBodySchema = Joi.object({
  collectionName: Joi.string().allow(null, "").label("Collection Name"),
  collectionDocument: Joi.string().allow(null, "").custom(objectIdValidation).label("Collection Document"),
  responses: Joi.array().items(
    Joi.object({
      formElementId: Joi.string().custom(objectIdValidation).required().label("Form Element ID"),
      responseValue: Joi.any().optional().allow(null).label("Response Value"),
    })
  ),
});

export const updateBodySchema = Joi.object({
  responses: Joi.array().items(
    Joi.object({
      formElementId: Joi.string().custom(objectIdValidation).required().label("Form Element ID"),
      responseValue: Joi.any().optional().allow(null).label("Response Value"),
    })
  ),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
  formId: Joi.string().custom(objectIdValidation).required().label("Form ID"),
});

/**
 * The contract for `GET /forms/:formId/submissions`.
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
  sort: Joi.string().valid("-createdAt", "createdAt").default("-createdAt"),

  collectionName: Joi.string().trim().max(100),
  collectionDocument: Joi.string().hex().length(24),
});

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

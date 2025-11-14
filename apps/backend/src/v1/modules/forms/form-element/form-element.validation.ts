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
  type: Joi.string().required().label("Type"),
  headElement: Joi.boolean().label("Head Element"),
  attributes: Joi.object().label("Attributes"),
  nextElementId: Joi.string().custom(objectIdValidation).allow(null).label("Next Element ID"),
  previousElementId: Joi.string().custom(objectIdValidation).allow(null).label("Previous Element ID"),
  parentElementId: Joi.string().custom(objectIdValidation).allow(null).label("Parent Element ID"),
});

export const updateBodySchema = Joi.object({
  attributes: Joi.object().label("Attributes"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
  formId: Joi.string().custom(objectIdValidation).required().label("Form ID"),
});

export const orderChangeBodySchema = Joi.object({
  nextElementId: Joi.string().custom(objectIdValidation).allow(null).label("Next Element ID"),
  previousElementId: Joi.string().custom(objectIdValidation).allow(null).label("Previous Element ID"),
});

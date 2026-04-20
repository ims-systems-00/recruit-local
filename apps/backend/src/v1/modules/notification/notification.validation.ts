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
  title: Joi.string().required().label("Title"),
  value: Joi.string().required().label("Value"),
  userId: Joi.string().optional().custom(objectIdValidation).label("User ID"),
  status: Joi.string().optional().label("Status"),
});

export const updateBodySchema = Joi.object({
  title: Joi.string().optional().label("Title"),
  value: Joi.string().optional().label("Value"),
  userId: Joi.string().optional().custom(objectIdValidation).label("User ID"),
  status: Joi.string().optional().label("Status"),
  readAt: Joi.date().optional().label("Read At"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

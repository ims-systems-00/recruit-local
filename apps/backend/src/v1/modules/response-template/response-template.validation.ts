import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";

const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const createBodySchema = Joi.object({
  keyword: Joi.string().required().label("Keyword"),
  fullText: Joi.string().required().label("Full Text"),
});

export const updateBodySchema = Joi.object({
  keyword: Joi.string().label("Keyword"),
  fullText: Joi.string().label("Full Text"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

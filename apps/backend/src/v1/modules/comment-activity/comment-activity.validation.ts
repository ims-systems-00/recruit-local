import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { COMMENT_ACTIVITY_COLLECTION_ENUMS } from "../../../models/constants";

// Custom validation for MongoDB ObjectId
const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const createBodySchema = Joi.object({
  collectionName: Joi.string()
    .valid(...Object.values(COMMENT_ACTIVITY_COLLECTION_ENUMS))
    .required()
    .label("Collection Name"),
  collectionDocument: Joi.string().required().custom(objectIdValidation).label("Collection Document"),
  value: Joi.string().required().label("Value"),
});

export const updateBodySchema = Joi.object({
  value: Joi.string().optional().label("Value"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

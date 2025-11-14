import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

// Custom validation for MongoDB ObjectId
const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const createBodySchema = Joi.object({
  collectionName: Joi.string().required().label("Collection Name"),
  collectionDocument: Joi.string().required().custom(objectIdValidation).label("Collection Document"),
  storageInformation: Joi.object<AwsStorageTemplate>({
    Name: Joi.string().required(),
    Key: Joi.string().required(),
    Bucket: Joi.string().required(),
  })
    .required()
    .label("Storage Information"),
});

export const updateBodySchema = Joi.object({
  collectionName: Joi.string().optional().label("Collection Name"),
  collectionDocument: Joi.string().optional().custom(objectIdValidation).label("Collection Document"),
  storageInformation: Joi.object<AwsStorageTemplate>({
    Name: Joi.string(),
    key: Joi.string(),
    Bucket: Joi.string(),
  })
    .optional()
    .label("Storage Information"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

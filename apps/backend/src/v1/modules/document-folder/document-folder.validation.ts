import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { DOCUMENT_FOLDER_TYPE_ENUMS } from "../../../models/constants";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

// Custom validation for MongoDB ObjectId
const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const createBodySchema = Joi.object({
  name: Joi.string().required().label("Name"),
  description: Joi.string().optional().label("Description"),
  type: Joi.string()
    .valid(...Object.values(DOCUMENT_FOLDER_TYPE_ENUMS))
    .required()
    .label("Type"),
  parentId: Joi.string().custom(objectIdValidation).optional().label("Parent ID"),
  storageInformation: Joi.object<AwsStorageTemplate>({
    Name: Joi.string(),
    key: Joi.string(),
    Key: Joi.string(),
    Bucket: Joi.string(),
  })
    .optional()
    .label("Storage Information")
    .when("type", {
      is: DOCUMENT_FOLDER_TYPE_ENUMS.DOCUMENT,
      then: Joi.required(),
      otherwise: Joi.allow(null),
    }),
  ownedBy: Joi.array().items(Joi.string().custom(objectIdValidation)).required().label("Owned By"),
});

export const updateBodySchema = Joi.object({
  name: Joi.string().optional().label("Name"),
  description: Joi.string().optional().label("Description"),
  type: Joi.string()
    .valid(...Object.values(DOCUMENT_FOLDER_TYPE_ENUMS))
    .optional()
    .label("Type"),
  parentId: Joi.string().custom(objectIdValidation).optional().label("Parent ID"),
  storageInformation: Joi.object<AwsStorageTemplate>({
    Name: Joi.string(),
    key: Joi.string(),
    Key: Joi.string(),
    Bucket: Joi.string(),
  })
    .optional()
    .label("Storage Information")
    .when("type", {
      is: DOCUMENT_FOLDER_TYPE_ENUMS.DOCUMENT,
      then: Joi.required(),
      otherwise: Joi.allow(null),
    }),
  ownedBy: Joi.array().items(Joi.string().custom(objectIdValidation)).optional().label("Owned By"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { TENANT_STATUS_ENUMS, TENANT_TYPE, TENANT_INDUSTRY_ENUMS } from "@rl/types";

// Custom validation for MongoDB ObjectId
const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path?.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

// Reusable storage schema for AWS templates
const awsStorageSchema = Joi.object({
  Name: Joi.string().label("Name"),
  Bucket: Joi.string().label("Bucket"),
  Key: Joi.string().label("Key"),
}).allow(null);

export const createBodySchema = Joi.object({
  name: Joi.string().max(300).required().label("Name"),
  description: Joi.string().allow("", null).label("Description"),
  industry: Joi.string()
    .valid(...Object.values(TENANT_INDUSTRY_ENUMS))
    .label("Industry"),
  type: Joi.string()
    .valid(...Object.values(TENANT_TYPE))
    .label("Type"),
  size: Joi.number().allow(null).label("Size"),
  phone: Joi.string().allow("", null).label("Phone"),
  email: Joi.string().email().allow("", null).label("Office Email"),

  logoSquareSrc: Joi.string().uri().allow("", null).label("Logo Square Src"),
  logoSquareStorage: awsStorageSchema.label("Logo Square Storage"),
  logoRectangleSrc: Joi.string().uri().allow("", null).label("Logo Rectangle Src"),
  logoRectangleStorage: awsStorageSchema.label("Logo Rectangle Storage"),

  officeAddress: Joi.string().allow("", null).label("Office Address"),
  addressInMap: Joi.string().allow("", null).label("Address In Map"),

  status: Joi.string()
    .valid(...Object.values(TENANT_STATUS_ENUMS))
    .default(TENANT_STATUS_ENUMS.ACTIVE)
    .label("Status"),

  website: Joi.string().uri().allow("", null).label("Website"),
  linkedIn: Joi.string().uri().allow("", null).label("LinkedIn"),

  missionStatement: Joi.string().allow("", null).label("Mission Statement"),
  visionStatement: Joi.string().allow("", null).label("Vision Statement"),
  coreProducts: Joi.string().allow("", null).label("Core Products"),
  coreServices: Joi.string().allow("", null).label("Core Services"),
});

export const updateBodySchema = createBodySchema.fork(Object.keys(createBodySchema.describe().keys), (schema) =>
  schema.optional()
);

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

export const logoUpdateParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
  logoStorage: Joi.string().valid("logoSquareStorage", "logoRectangleStorage").required().label("Logo Storage"),
});

export const bulkDeleteBodySchema = Joi.object({
  ids: Joi.array().items(Joi.string().custom(objectIdValidation).label("id")).max(100).required().label("ids"),
});

export const logoUpdateBodySchema = Joi.object({
  logoSquareStorage: awsStorageSchema.label("Logo Square Storage"),
  logoRectangleStorage: awsStorageSchema.label("Logo Rectangle Storage"),
})
  .or("logoSquareStorage", "logoRectangleStorage")
  .label("Logo Storage");

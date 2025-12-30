import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { ACCOUNT_TYPE_ENUMS, USER_ROLE_ENUMS } from "@inrm/types";

// Custom validation for MongoDB ObjectId
const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

export const updateBodySchema = Joi.object({
  firstName: Joi.string().optional().label("First Name"),
  lastName: Joi.string().optional().label("Last Name"),
  type: Joi.string()
    .valid(...Object.values(ACCOUNT_TYPE_ENUMS))
    .optional()
    .label("Type"),
  role: Joi.string()
    .valid(...Object.values(USER_ROLE_ENUMS))
    .optional()
    .label("Role"),
});

export const profileImageBodySchema = Joi.object({
  Name: Joi.string().required().label("Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
});

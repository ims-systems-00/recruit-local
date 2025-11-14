import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { USER_TYPE_ENUMS, YES_NO_ENUM, USER_ROLE_ENUMS } from "@inrm/types";

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
  profileImageStorage: Joi.object().optional().label("Profile Image Storage"),
  type: Joi.string()
    .valid(...Object.values(USER_TYPE_ENUMS))
    .optional()
    .label("Type"),
  voIPNumber: Joi.string().optional().label("VoIP Number"),
  role: Joi.string()
    .valid(...Object.values(USER_ROLE_ENUMS))
    .optional()
    .label("Role"),
  isConsultant: Joi.string()
    .valid(...Object.values(YES_NO_ENUM))
    .optional()
    .label("Is Consultant"),
  isPrimaryUser: Joi.string()
    .valid(...Object.values(YES_NO_ENUM))
    .optional()
    .label("Is Primary User"),
});

export const profileImageBodySchema = Joi.object({
  Name: Joi.string().required().label("Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
});

import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { FORM_STATUS_ENUMS } from "../../../../models/constants";

// Custom validation for MongoDB ObjectId
const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const createBodySchema = Joi.object({
  title: Joi.string().required().max(50).label("Title"),
  description: Joi.string().max(255).label("Description"),
  status: Joi.string()
    .valid(...Object.values(FORM_STATUS_ENUMS))
    .label("Status"),
  theme: Joi.string().max(50).label("Theme"),
  usagesType: Joi.string().label("Usages Type"),
  availableForTenantWithStandards: Joi.array().items(Joi.string()).label("Available For Tenant With Standards"),
});

export const updateBodySchema = Joi.object({
  title: Joi.string().max(50).label("Title"),
  description: Joi.string().max(255).label("Description"),
  status: Joi.string()
    .valid(...Object.values(FORM_STATUS_ENUMS))
    .label("Status"),
  theme: Joi.string().max(50).label("Theme"),
  usagesType: Joi.string().label("Usages Type"),
  availableForTenantWithStandards: Joi.array().items(Joi.string()).label("Available For Tenant With Standards"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { USER_ROLE_ENUMS, ACCOUNT_TYPE_ENUMS, KYC_STATUS } from "@rl/types";
import { EMAIL_VERIFICATION_STATUS_ENUMS } from "../../../models/constants";

// Custom validation for MongoDB ObjectId
const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

// todo: keep it in a common space later
export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

export const updateBodySchema = Joi.object({
  firstName: Joi.string().optional().label("First Name"),
  lastName: Joi.string().optional().label("Last Name"),
  role: Joi.string()
    .valid(...Object.values(USER_ROLE_ENUMS))
    .optional()
    .label("Role"),
});

/**
 * The contract for `GET /users`.
 *
 * `fullName` was the old `searchField`, but it is a virtual — not a stored path —
 * so the regex never matched anything. The real fields are searched instead.
 */
export const listQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page. Kept because the frontend still sends `page: … || 1`.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string()
    .valid("-createdAt", "createdAt", "firstName", "-firstName", "lastName", "-lastName", "email", "-email")
    .default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),

  role: Joi.string().valid(...Object.values(USER_ROLE_ENUMS)),
  type: Joi.string().valid(...Object.values(ACCOUNT_TYPE_ENUMS)),
  emailVerificationStatus: Joi.string().valid(...Object.values(EMAIL_VERIFICATION_STATUS_ENUMS)),
  kycStatus: Joi.string().valid(...Object.values(KYC_STATUS)),
});

import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import { PROFICIENCY, VISIBILITY } from "@rl/types";

// --- Sub-Schemas ---
// Reusable validation for AwsStorageTemplate
const awsStorageSchema = Joi.object({
  Name: Joi.string().required().label("Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
})
  .unknown(true)
  .label("Storage File");

// --- Main Schemas ---

export const createBodySchema = Joi.object({
  name: Joi.string().optional().label("Name"),
  headline: Joi.string().optional().label("Headline"),
  address: Joi.string().optional().label("Address"),
  email: Joi.string().email().optional().label("Email"),
  contactNumber: Joi.string().optional().label("Contact Number"),
  summary: Joi.string().optional().label("Summary"),
  portfolioUrl: Joi.string().uri().optional().label("Portfolio URL"),
  keywords: Joi.array().items(Joi.string()).optional().label("Keywords"),
  languages: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().label("Language Name"),
        proficiencyLevel: Joi.string()
          .valid(...Object.values(PROFICIENCY))
          .required()
          .label("Proficiency Level"),
      })
    )
    .optional()
    .label("Languages"),
  skills: Joi.string().optional().label("Skills"),
  interests: Joi.string().optional().label("Interests"),
  kycDocumentStorage: awsStorageSchema.optional().label("KYC Document Storage"),
});

export const updateBodySchema = Joi.object({
  name: Joi.string().optional().label("Name"),
  headline: Joi.string().optional().label("Headline"),
  address: Joi.string().optional().label("Address"),
  email: Joi.string().email().optional().label("Email"),
  contactNumber: Joi.string().optional().label("Contact Number"),
  summary: Joi.string().optional().label("Summary"),
  portfolioUrl: Joi.string().uri().optional().label("Portfolio URL"),
  keywords: Joi.array().items(Joi.string()).optional().label("Keywords"),
  languages: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().label("Language Name"),
        proficiencyLevel: Joi.string()
          .valid(...Object.values(PROFICIENCY))
          .required()
          .label("Proficiency Level"),
      })
    )
    .optional()
    .label("Languages"),
  skills: Joi.string().optional().label("Skills"),
  interests: Joi.string().optional().label("Interests"),
  visibility: Joi.string()
    .valid(...Object.values(VISIBILITY))
    .optional()
    .label("Visibility"),
  kycDocumentStorage: awsStorageSchema.optional().label("KYC Document Storage"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

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
  headline: Joi.string().optional().label("Headline"),
  summary: Joi.string().optional().label("Summary"),
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

  kycDocumentStorage: awsStorageSchema.optional().label("KYC Document Storage"),
});

export const updateBodySchema = Joi.object({
  headline: Joi.string().optional().label("Headline"),
  summary: Joi.string().optional().label("Summary"),
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
  visibility: Joi.string()
    .valid(...Object.values(VISIBILITY))
    .optional()
    .label("Visibility"),
  kycDocumentStorage: awsStorageSchema.optional().label("KYC Document Storage"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

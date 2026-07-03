import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import { PROFICIENCY, VISIBILITY, ONBOARDING_STEP_ENUMS } from "@rl/types";

// --- Sub-Schemas ---

// Reusable storage schema for AWS templates (profile/cover photo uploads).
const awsStorageSchema = Joi.object({
  Name: Joi.string().label("Name"),
  Bucket: Joi.string().label("Bucket"),
  Key: Joi.string().label("Key"),
}).allow(null);

// --- Main Schemas ---

export const createBodySchema = Joi.object({
  name: Joi.string().optional().label("Name"),
  jobTitle: Joi.array().items(Joi.string().custom(objectIdValidation)).optional().label("Job Title"),
  industry: Joi.array().items(Joi.string().custom(objectIdValidation)).optional().label("Industry"),
  workMode: Joi.array().items(Joi.string().custom(objectIdValidation)).optional().label("Work Mode"),
  experienceLevel: Joi.string().custom(objectIdValidation).optional().label("Experience Level"),
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
  values: Joi.array().items(Joi.string().custom(objectIdValidation)).optional().label("Values"),
  onboardingStep: Joi.string()
    .valid(...Object.values(ONBOARDING_STEP_ENUMS))
    .optional()
    .label("Onboarding Step"),
  profileImageStorage: awsStorageSchema.label("Profile Image Storage"),
  coverPhotoStorage: awsStorageSchema.label("Cover Photo Storage"),
});

export const updateBodySchema = Joi.object({
  name: Joi.string().optional().label("Name"),
  jobTitle: Joi.array().items(Joi.string().custom(objectIdValidation)).optional().label("Job Title"),
  industry: Joi.array().items(Joi.string().custom(objectIdValidation)).optional().label("Industry"),
  workMode: Joi.array().items(Joi.string().custom(objectIdValidation)).optional().label("Work Mode"),
  experienceLevel: Joi.string().custom(objectIdValidation).optional().label("Experience Level"),
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
  values: Joi.array().items(Joi.string().custom(objectIdValidation)).optional().label("Values"),
  onboardingStep: Joi.string()
    .valid(...Object.values(ONBOARDING_STEP_ENUMS))
    .optional()
    .label("Onboarding Step"),
  visibility: Joi.string()
    .valid(...Object.values(VISIBILITY))
    .optional()
    .label("Visibility"),
  profileImageStorage: awsStorageSchema.label("Profile Image Storage"),
  coverPhotoStorage: awsStorageSchema.label("Cover Photo Storage"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

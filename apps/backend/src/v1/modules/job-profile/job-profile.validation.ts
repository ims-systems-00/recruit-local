import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import { PROFICIENCY, VISIBILITY, ONBOARDING_STEP_ENUMS, JOB_PROFILE_STATUS_ENUM } from "@rl/types";

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

/**
 * The contract for `GET /job-profiles`.
 *
 * `headline` was the old `searchField`, but JobProfile has no such path — that
 * half of the search never matched anything. `name` and `summary` are the stored
 * fields.
 */
export const listQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page. Kept because the frontend still sends `page: … || 1`.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("-createdAt", "createdAt", "name", "-name").default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  search: Joi.string().trim().max(200).allow(""),

  userId: Joi.string().custom(objectIdValidation),
  status: Joi.string().valid(...Object.values(JOB_PROFILE_STATUS_ENUM)),
  visibility: Joi.string().valid(...Object.values(VISIBILITY)),
  onboardingStep: Joi.string().valid(...Object.values(ONBOARDING_STEP_ENUMS)),
  experienceLevel: Joi.string().custom(objectIdValidation),
  jobTitle: Joi.string().custom(objectIdValidation),
  industry: Joi.string().custom(objectIdValidation),
  workMode: Joi.string().custom(objectIdValidation),
})
  // The frontend sends `search`; everything downstream reads `clientSearch`, so
  // rename rather than teach the pipeline a second key. `override` must be true:
  // with Joi's default of false, a caller sending both keys gets a 400.
  .rename("search", "clientSearch", { ignoreUndefined: true, override: true });

/**
 * The contract for `GET /job-profiles/:id/applied-jobs`.
 *
 * It returns jobs but pages over the candidate's *applications* — the jobs query is
 * a lookup of the ids on that page, not a page of its own — so the cursor and the
 * sort belong to the application, and there are no job filters here. The profile
 * comes from the route param, never the query string.
 */
export const appliedJobsQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page. Kept because the frontend still sends `page: … || 1`.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("-createdAt", "createdAt").default("-createdAt"),
});

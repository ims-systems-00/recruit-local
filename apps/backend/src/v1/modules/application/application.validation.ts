import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

const awsStorageSchema = Joi.object({
  Name: Joi.string().required().label("Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
}).label("AWS Storage");

// Validates the IApplicationAnswer interface
const applicationAnswerSchema = Joi.object({
  queryId: Joi.string().custom(objectIdValidation).required().label("Query ID"),
  answer: Joi.alternatives()
    .try(Joi.string().allow(""), Joi.array().items(Joi.string()), Joi.number(), Joi.boolean())
    .required()
    .label("Answer"),
}).label("Application Answer");

export const createBodySchema = Joi.object({
  jobId: Joi.string().custom(objectIdValidation).required().label("Job ID"),
  jobProfileId: Joi.string().custom(objectIdValidation).required().label("Job Profile ID"),
  coverLetter: Joi.string().optional().allow("").label("Cover Letter"),

  // Storage payloads
  resumeStorage: awsStorageSchema.optional().label("Resume File Data"),
  caseStudyStorage: Joi.array().items(awsStorageSchema).optional().label("Case Study File Data"),

  // New primitive fields
  answers: Joi.array().items(applicationAnswerSchema).optional().label("Answers"),
  portfolioUrl: Joi.string().uri().optional().allow("").label("Portfolio URL"),
  currentSalary: Joi.number().optional().label("Current Salary"),
  expectedSalary: Joi.number().optional().label("Expected Salary"),

  // Admin/Internal fields (optional on create)
  feedback: Joi.string().optional().allow("").label("Feedback"),
  appliedAt: Joi.date().optional().label("Applied Date"),
});

export const updateBodySchema = Joi.object({
  statusId: Joi.string().custom(objectIdValidation).required().label("Status"),
  coverLetter: Joi.string().optional().allow("").label("Cover Letter"),

  // Storage payloads
  resumeStorage: awsStorageSchema.optional().label("Resume File Data"),
  caseStudyStorage: Joi.array().items(awsStorageSchema).optional().label("Case Study File Data"),

  // New primitive fields
  answers: Joi.array().items(applicationAnswerSchema).optional().label("Answers"),
  portfolioUrl: Joi.string().uri().optional().allow("").label("Portfolio URL"),
  currentSalary: Joi.number().optional().label("Current Salary"),
  expectedSalary: Joi.number().optional().label("Expected Salary"),

  // Admin/Internal fields
  feedback: Joi.string().optional().allow("").label("Feedback"),
  appliedAt: Joi.date().optional().label("Applied Date"),
});

export const statusUpdateBodySchema = Joi.object({
  statusId: Joi.string().custom(objectIdValidation).required().label("Status"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("Application ID"),
});

/**
 * The contract for `GET /applications`.
 *
 * Joi objects reject unknown keys, which is the point: before this a typo'd param
 * became a `$match` clause and the endpoint quietly returned nothing.
 */
export const listQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page. Kept because the frontend still sends `page: … || 1`.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string()
    .valid("-createdAt", "createdAt", "-matchScore", "matchScore", "-updatedAt", "updatedAt")
    .default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),

  jobId: Joi.string().custom(objectIdValidation),
  tenantId: Joi.string().custom(objectIdValidation),
  jobProfileId: Joi.string().custom(objectIdValidation),
  statusId: Joi.string().custom(objectIdValidation),
  reference: Joi.string().trim().max(200),
  matchScore: Joi.object({ gte: Joi.number(), lte: Joi.number() }),
});

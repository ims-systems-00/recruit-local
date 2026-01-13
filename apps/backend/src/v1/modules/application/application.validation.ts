import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import { APPLICATION_STATUS_ENUM } from "@inrm/types";

const awsStorageSchema = Joi.object({
  Name: Joi.string().required().label("Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
}).label("AWS Storage");

export const createBodySchema = Joi.object({
  jobId: Joi.string().custom(objectIdValidation).required().label("Job ID"),
  jobProfileId: Joi.string().custom(objectIdValidation).required().label("Job Profile ID"),
  coverLetter: Joi.string().optional().allow("").label("Cover Letter"),
  // Resume File
  resumeSrc: Joi.string().uri().optional().label("Resume Link"),
  resumeStorage: awsStorageSchema.optional().label("Resume File Data"),

  // Admin/Internal fields (optional on create)
  feedback: Joi.string().optional().allow("").label("Feedback"),
  appliedAt: Joi.date().optional().label("Applied Date"),
});

export const updateBodySchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(APPLICATION_STATUS_ENUM))
    .optional()
    .label("Status"),

  coverLetter: Joi.string().optional().allow("").label("Cover Letter"),

  resumeSrc: Joi.string().uri().optional().allow("").label("Resume Link"),
  resumeStorage: awsStorageSchema.optional().label("Resume File Data"),

  feedback: Joi.string().optional().allow("").label("Feedback"),
  appliedAt: Joi.date().optional().label("Applied Date"),
});

export const statusUpdateBodySchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(APPLICATION_STATUS_ENUM))
    .required()
    .label("Status"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("Application ID"),
});

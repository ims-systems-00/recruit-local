import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import { KYC_DOCUMENT_TYPE, KYC_STATUS } from "@rl/types";

const awsStorageSchema = Joi.object({
  Name: Joi.string().required().label("Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
}).label("AWS Storage");

export const createBodySchema = Joi.object({
  firstName: Joi.string().required().label("First Name"),
  lastName: Joi.string().required().label("Last Name"),
  dateOfBirth: Joi.date().required().label("Date of Birth"),
  documentType: Joi.string()
    .valid(...Object.values(KYC_DOCUMENT_TYPE))
    .required()
    .label("Document Type"),
  documentFrontStorage: awsStorageSchema.required().label("Document Front File Data"),
  documentBackStorage: awsStorageSchema.optional().label("Document Back File Data"),
});

export const updateBodySchema = Joi.object({
  firstName: Joi.string().optional().label("First Name"),
  lastName: Joi.string().optional().label("Last Name"),
  dateOfBirth: Joi.date().optional().label("Date of Birth"),
  documentType: Joi.string()
    .valid(...Object.values(KYC_DOCUMENT_TYPE))
    .optional()
    .label("Document Type"),
  documentFrontStorage: awsStorageSchema.optional().label("Document Front File Data"),
  documentBackStorage: awsStorageSchema.optional().allow(null).label("Document Back File Data"),
  status: Joi.string()
    .valid(...Object.values(KYC_STATUS))
    .optional()
    .label("Status"),
  rejectionReason: Joi.string().optional().allow("").label("Rejection Reason"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

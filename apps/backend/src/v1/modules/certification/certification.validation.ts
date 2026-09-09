import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

const awsStorageSchema = Joi.object({
  Name: Joi.string().required().label("File Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
}).label("AWS Storage");

export const createBodySchema = Joi.object({
  jobProfileId: Joi.string().custom(objectIdValidation).required().label("Job Profile ID"),
  title: Joi.string().required().label("Title"),
  issuingOrganization: Joi.string().required().label("Issuing Organization"),
  issueDate: Joi.date().required().label("Issue Date"),
  imageStorage: awsStorageSchema.optional().label("Image File Data"),
});

export const updateBodySchema = Joi.object({
  title: Joi.string().optional().label("Title"),
  issuingOrganization: Joi.string().optional().label("Issuing Organization"),
  issueDate: Joi.date().optional().label("Issue Date"),
  imageStorage: awsStorageSchema.optional().label("Image File Data"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * The contract for `GET /certifications`.
 *
 * Joi objects reject unknown keys, which is the point: before this a typo'd param
 * became a `$match` clause and the endpoint quietly returned nothing.
 */
export const listQuerySchema = Joi.object({
  // Forward-only cursor from the previous response's `pagination.nextCursor`.
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page. Kept because the frontend still sends `page: … || 1`.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string()
    .valid("-issueDate", "issueDate", "-createdAt", "createdAt", "title", "-title")
    .default("-issueDate"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  jobProfileId: Joi.string().custom(objectIdValidation),
  issuingOrganization: Joi.string().trim().max(200),
  issueDate: Joi.object({ gte: Joi.date().iso(), lte: Joi.date().iso() }),
});

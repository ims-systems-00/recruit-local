import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

export const createBodySchema = Joi.object({
  jobProfileId: Joi.string().custom(objectIdValidation).required().label("Job Profile ID"),
  institution: Joi.string().required().label("Institution"),
  degree: Joi.string().required().label("Degree"),
  fieldOfStudy: Joi.string().optional().label("Field of Study"),
  startDate: Joi.date().optional().label("Start Date"),
  endDate: Joi.date().optional().label("End Date"),
  grade: Joi.string().optional().label("Grade"),
  description: Joi.string().optional().label("Description"),
});

export const updateBodySchema = Joi.object({
  institution: Joi.string().optional().label("Institution"),
  degree: Joi.string().optional().label("Degree"),
  fieldOfStudy: Joi.string().optional().label("Field of Study"),
  startDate: Joi.date().optional().label("Start Date"),
  endDate: Joi.date().optional().label("End Date"),
  grade: Joi.string().optional().label("Grade"),
  description: Joi.string().optional().label("Description"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * The contract for `GET /educations`.
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
    .valid("-startDate", "startDate", "-endDate", "endDate", "-createdAt", "createdAt")
    .default("-startDate"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  jobProfileId: Joi.string().custom(objectIdValidation),
  fieldOfStudy: Joi.string().trim().max(200),
  startDate: Joi.object({ gte: Joi.date().iso(), lte: Joi.date().iso() }),
});

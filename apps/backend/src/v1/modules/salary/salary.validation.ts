import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

export const createBodySchema = Joi.object({
  jobTitle: Joi.string().min(2).max(200).required().label("Job Title"),
  location: Joi.string().min(2).max(200).required().label("Location"),
  experienceLevel: Joi.string().min(2).max(100).required().label("Experience Level"),
  minSalary: Joi.number().min(0).required().label("Min Salary"),
  maxSalary: Joi.number().min(0).required().label("Max Salary"),
  currency: Joi.string().min(1).max(10).required().label("Currency"),
});

export const updateBodySchema = Joi.object({
  jobTitle: Joi.string().min(2).max(200).optional().label("Job Title"),
  location: Joi.string().min(2).max(200).optional().label("Location"),
  experienceLevel: Joi.string().min(2).max(100).optional().label("Experience Level"),
  minSalary: Joi.number().min(0).optional().label("Min Salary"),
  maxSalary: Joi.number().min(0).optional().label("Max Salary"),
  currency: Joi.string().min(1).max(10).optional().label("Currency"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * The contract for `GET /public/salaries`.
 *
 * Public and unauthenticated, so the allowlist is the only thing standing between
 * a query string and `$match`.
 */
export const listQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string()
    .valid("-createdAt", "createdAt", "minSalary", "-minSalary", "maxSalary", "-maxSalary")
    .default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  jobTitle: Joi.string().trim().max(200),
  location: Joi.string().trim().max(200),
  experienceLevel: Joi.string().trim().max(100),
  currency: Joi.string().trim().max(10),
  minSalary: Joi.object({ gte: Joi.number(), lte: Joi.number() }),
  maxSalary: Joi.object({ gte: Joi.number(), lte: Joi.number() }),
});

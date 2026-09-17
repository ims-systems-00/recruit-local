import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

export const upsertBodySchema = Joi.object({
  interest: Joi.string().min(1).max(1000).required(),
  isSkipped: Joi.boolean().optional(),
});

export const skipBodySchema = Joi.object({
  isSkipped: Joi.boolean().valid(true).required(),
});

export const updateBodySchema = Joi.object({
  interest: Joi.string().min(1).max(1000).optional(),
  isSkipped: Joi.boolean().optional(),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * The contract for `GET /user-interest-surveys`.
 *
 * Joi objects reject unknown keys, which is the point: before this a typo'd param
 * became a `$match` clause and the endpoint quietly returned nothing.
 */
export const listQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Removed: paging is by cursor. Accepted and dropped rather than 400'ing a
  // caller that still sends it.
  page: Joi.any().strip(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("-createdAt", "createdAt", "-updatedAt", "updatedAt").default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  userId: Joi.string().custom(objectIdValidation),
  isSkipped: Joi.boolean(),
});

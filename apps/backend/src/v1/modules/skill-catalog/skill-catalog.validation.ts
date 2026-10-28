import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

// `normalizedName` is derived by the model; Joi's default of rejecting unknown
// keys is what keeps a client from writing it.
export const createBodySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().label("Name"),
  description: Joi.string().trim().max(500).optional().label("Description"),
  isActive: Joi.boolean().optional().label("Is Active"),
});

export const updateBodySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional().label("Name"),
  description: Joi.string().trim().max(500).optional().label("Description"),
  isActive: Joi.boolean().optional().label("Is Active"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * The contract for `GET /skill-catalog` — mainly the job form's tag input, which
 * sends `clientSearch` as the employer types.
 *
 * Joi objects reject unknown keys, so a typo'd param is a 400 rather than a
 * `$match` that quietly returns nothing.
 */
export const listQuerySchema = Joi.object({
  // Forward-only cursor from the previous response's `pagination.nextCursor`.
  cursor: Joi.string().trim().max(512),
  // Paging is by cursor. Accepted and dropped rather than 400'ing a caller that sends it.
  page: Joi.any().strip(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("name", "-name", "createdAt", "-createdAt", "updatedAt", "-updatedAt").default("name"),

  clientSearch: Joi.string().trim().max(100).allow(""),
  // Only narrows an admin's view; everyone else is already pinned to active
  // entries by the ability's security query.
  isActive: Joi.boolean(),
});

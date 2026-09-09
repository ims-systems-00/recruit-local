import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

export const createBodySchema = Joi.object({
  jobProfileId: Joi.string().custom(objectIdValidation).required().label("Job Profile ID"),
  name: Joi.string().min(2).max(50).required(),
  proficiencyLevel: Joi.string().optional(),
  description: Joi.string().max(500).optional(),
});

export const updateBodySchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  proficiencyLevel: Joi.string().optional(),
  description: Joi.string().max(500).optional(),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * The contract for `GET /skills`.
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
  sort: Joi.string().valid("-createdAt", "createdAt", "name", "-name").default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  // Whose skills to list. The controller checks the viewer may see that profile
  // before it reaches the filter.
  jobProfileId: Joi.string().custom(objectIdValidation),
  proficiencyLevel: Joi.string().trim().max(100),
});

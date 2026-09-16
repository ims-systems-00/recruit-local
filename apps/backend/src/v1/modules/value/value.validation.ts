import Joi from "joi";
import { VALUE_TYPE_ENUM } from "@rl/types";
import { objectIdValidation } from "../../../common/helper/validate";

export const createBodySchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(VALUE_TYPE_ENUM))
    .required()
    .label("Type"),
  label: Joi.string().min(2).max(200).required().label("Label"),
  isActive: Joi.boolean().optional().label("Is Active"),
  weight: Joi.number().min(0).optional().label("Weight"),
});

export const updateBodySchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(VALUE_TYPE_ENUM))
    .optional()
    .label("Type"),
  label: Joi.string().min(2).max(200).optional().label("Label"),
  isActive: Joi.boolean().optional().label("Is Active"),
  weight: Joi.number().min(0).optional().label("Weight"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * The contract for `GET /values`.
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
  // `MongoQuery` passed no sort, so this came back in natural order — which cursor
  // paging cannot walk safely. Ascending `createdAt` is the seeded order.
  sort: Joi.string().valid("createdAt", "-createdAt", "label", "-label", "weight", "-weight").default("createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  type: Joi.string().valid(...Object.values(VALUE_TYPE_ENUM)),
});

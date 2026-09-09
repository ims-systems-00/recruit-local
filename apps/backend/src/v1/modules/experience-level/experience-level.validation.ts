import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

// The band of professional experience the level covers, in years. Null on
// either end is meaningful: a null `maxYears` is an open-ended top level
// ("15+"), and a level with neither end set is simply not comparable to a job's
// `yearOfExperience` — the ranking pipeline drops the signal rather than guess.
const minYears = Joi.number().integer().min(0).allow(null).optional().label("Minimum Years");

const maxYears = Joi.number()
  .integer()
  .min(0)
  .allow(null)
  .optional()
  .when("minYears", {
    is: Joi.number().min(0).required(),
    then: Joi.number().integer().min(Joi.ref("minYears")).allow(null),
  })
  .label("Maximum Years");

export const createBodySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  isActive: Joi.boolean().optional(),
  minYears,
  maxYears,
});

export const updateBodySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional(),
  isActive: Joi.boolean().optional(),
  minYears,
  maxYears,
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * The contract for `GET /experience-levels`.
 *
 * Joi objects reject unknown keys, which is the point: before this a typo'd param
 * became a `$match` clause and the endpoint quietly returned nothing.
 */
export const listQuerySchema = Joi.object({
  // Forward-only cursor from the previous response's `pagination.nextCursor`.
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page. Kept because every frontend service still sends `page: … || 1`.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  // `MongoQuery` passed no sort at all, so this list came back in natural order —
  // which cursor paging cannot walk safely. Ascending `createdAt` is the seeded
  // order, so what the dropdowns show does not change.
  sort: Joi.string().valid("createdAt", "-createdAt", "name", "-name", "updatedAt", "-updatedAt").default("createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
});

import Joi from "joi";
import { modelNames } from "../../../models/constants";
import { objectIdValidation } from "../../../common/helper/validate";

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("Favourite ID"),
});

export const createFavouriteBodySchema = Joi.object({
  itemId: Joi.string().custom(objectIdValidation).required().label("Item ID"),
  itemType: Joi.string()
    .valid(...Object.values(modelNames))
    .required()
    .label("Favourite Type"),
});

export const updateFavouriteBodySchema = Joi.object({
  itemType: Joi.string()
    .valid(...Object.values(modelNames))
    .optional()
    .label("Favourite Type"),
});

/**
 * The contract for `GET /favourites`.
 *
 * There is no free-text search here — a Favourite is just a pointer (itemType +
 * itemId), so there is nothing on the document to match. The old
 * `searchFields: []` said the same thing.
 */
export const favouriteListQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("-createdAt", "createdAt").default("-createdAt"),

  tenantId: Joi.string().custom(objectIdValidation).label("Tenant Filter"),
  jobProfileId: Joi.string().custom(objectIdValidation).label("Job Profile Filter"),
  itemId: Joi.string().custom(objectIdValidation).label("Item Filter"),
  itemType: Joi.string()
    .valid(...Object.values(modelNames))
    .label("Type Filter"),

  createdAt: Joi.object({ gte: Joi.date().iso(), lte: Joi.date().iso() }),
});

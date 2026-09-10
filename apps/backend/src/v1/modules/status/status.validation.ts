import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createStatusBodySchema = Joi.object({
  collectionName: Joi.string().trim().max(100).required().label("Collection Name"),
  collectionId: objectId.optional().label("Collection ID"),
  label: Joi.string().trim().max(100).required().label("Status Label"),
  weight: Joi.number().integer().min(0).default(0).label("Status Weight"),
  default: Joi.boolean().default(false).label("Is Default Status"),
  backgroundColor: Joi.string()
    .trim()
    .max(7)
    .pattern(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .default("#FFFFFF")
    .label("Background Color"),
});

export const updateStatusBodySchema = Joi.object({
  collectionName: Joi.string().trim().max(100).optional().label("Collection Name"),
  collectionId: objectId.optional().label("Collection ID"),
  label: Joi.string().trim().max(100).optional().label("Status Label"),
  weight: Joi.number().integer().min(0).optional().label("Status Weight"),
  default: Joi.boolean().optional().label("Is Default Status"),
  backgroundColor: Joi.string()
    .trim()
    .max(7)
    .pattern(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .optional()
    .label("Background Color"),
});

/**
 * The contract for `GET /statuses`.
 *
 * The old schema declared `sortBy`/`sortOrder`, which `MongoQuery` ignored, while
 * rejecting `clientSearch`, which it read — so search was unreachable here. Both
 * legacy keys are accepted and dropped rather than 400'ing a page that works today.
 */
export const statusListQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  // "asc"/"desc" were this key's old values. They are not sort tokens, so the
  // builder ignores them and falls back to the default — which is what happened
  // before anyway, since MongoQuery never applied this sort.
  sort: Joi.string()
    .valid("createdAt", "-createdAt", "weight", "-weight", "label", "-label", "asc", "desc")
    .default("createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),

  collectionName: Joi.string().trim().max(100).label("Filter by Collection Name"),
  collectionId: objectId.label("Filter by Collection ID"),
  label: Joi.string().trim().max(100).label("Filter by Status Label"),

  // Never actually applied by MongoQuery. Accept and drop.
  sortBy: Joi.any().strip(),
  sortOrder: Joi.any().strip(),
});

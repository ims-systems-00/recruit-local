import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createActionBodySchema = Joi.object({
  statusId: objectId.required().label("Status ID"),
  actionType: Joi.string().trim().max(100).required().label("Action Type"),
  metadata: Joi.object().optional().label("Metadata"),
});

export const updateActionBodySchema = Joi.object({
  statusId: objectId.optional().label("Status ID"),
  actionType: Joi.string().trim().max(100).optional().label("Action Type"),
  metadata: Joi.object().optional().label("Metadata"),
});

/**
 * The contract for `GET /actions`.
 *
 * The old schema declared `sortBy`/`sortOrder`, which `MongoQuery` ignored, while
 * rejecting `clientSearch`, which it read — so search was unreachable here. Both
 * legacy keys are accepted and dropped rather than 400'ing a page that works today.
 */
export const actionListQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string()
    .valid("-createdAt", "createdAt", "-updatedAt", "updatedAt", "actionType", "-actionType")
    .default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),

  statusId: objectId.label("Filter by Status ID"),
  actionType: Joi.string().trim().max(100).label("Filter by Action Type"),

  // Never actually applied by MongoQuery. Accept and drop.
  sortBy: Joi.any().strip(),
  sortOrder: Joi.any().strip(),
});

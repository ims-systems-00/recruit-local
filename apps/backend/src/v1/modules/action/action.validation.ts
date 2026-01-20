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

export const actionListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),

  sortBy: Joi.string().valid("createdAt", "updatedAt", "actionType").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

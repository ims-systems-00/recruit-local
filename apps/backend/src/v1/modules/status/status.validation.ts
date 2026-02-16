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

export const statusListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),

  collectionName: Joi.string().trim().max(100).optional().label("Filter by Collection Name"),
  collectionId: objectId.optional().label("Filter by Collection ID"),
  label: Joi.string().trim().max(100).optional().label("Filter by Status Label"),

  sort: Joi.string().valid("desc", "asc").default("desc"),
  sortBy: Joi.string().valid("createdAt", "collectionName", "label").default("createdAt"),
});

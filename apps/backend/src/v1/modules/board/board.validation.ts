import Joi from "joi";

const objectId = Joi.string().hex().length(24);

/**
 * Validation for creating a new Board
 */
export const createBoardBodySchema = Joi.object({
  title: Joi.string().trim().required().label("Title"),
  description: Joi.string().trim().optional().allow("").label("Description"),
  collectionName: Joi.string().trim().optional().label("Collection Name"),
  collectionId: Joi.string().trim().optional().label("Collection ID"),
  columnOrder: Joi.array().items(objectId).default([]).label("Column Order"),
  isTemplate: Joi.boolean().default(false).label("Is Template"),
  background: Joi.string().trim().default("#ffffff").label("Background"),
});

/**
 * Validation for updating an existing Board
 * All fields are optional to allow partial updates
 */
export const updateBoardBodySchema = Joi.object({
  title: Joi.string().trim().optional().label("Title"),
  description: Joi.string().trim().optional().allow("").label("Description"),
  collectionName: Joi.string().trim().optional().label("Collection Name"),
  collectionId: Joi.string().trim().optional().label("Collection ID"),
  columnOrder: Joi.array().items(objectId).optional().label("Column Order"),
  isTemplate: Joi.boolean().optional().label("Is Template"),
  background: Joi.string().trim().optional().label("Background"),
}).min(1);

/**
 * Validation for querying/listing Boards
 */
export const boardListQuerySchema = Joi.object({
  // Forward-only cursor from the previous response's `pagination.nextCursor`.
  cursor: Joi.string().trim().max(512),
  limit: Joi.number().integer().min(1).max(100).default(10),

  // Search and Filter fields
  search: Joi.string().trim().optional(),
  isTemplate: Joi.boolean().optional(),
  collectionName: Joi.string().trim().optional().label("Filter by Collection Name"),
  collectionId: objectId.optional().label("Filter by Collection ID"),

  sort: Joi.string()
    .valid("title", "-title", "createdAt", "-createdAt", "updatedAt", "-updatedAt")
    .default("-createdAt"),

  // Never actually applied by MongoQuery. Accept and drop.
  sortBy: Joi.any().strip(),
  sortOrder: Joi.any().strip(),
});

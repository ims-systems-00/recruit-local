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
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),

  // Search and Filter fields
  search: Joi.string().trim().optional(),
  isTemplate: Joi.boolean().optional(),

  // Sorting
  sortBy: Joi.string().valid("title", "createdAt", "updatedAt").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

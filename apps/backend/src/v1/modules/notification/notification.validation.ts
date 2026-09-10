import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";

// Custom validation for MongoDB ObjectId
const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const createBodySchema = Joi.object({
  title: Joi.string().required().label("Title"),
  value: Joi.string().required().label("Value"),
  userId: Joi.string().optional().custom(objectIdValidation).label("User ID"),
  status: Joi.string().optional().label("Status"),
});

export const updateBodySchema = Joi.object({
  title: Joi.string().optional().label("Title"),
  value: Joi.string().optional().label("Value"),
  userId: Joi.string().optional().custom(objectIdValidation).label("User ID"),
  status: Joi.string().optional().label("Status"),
  readAt: Joi.date().optional().label("Read At"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * The contract for `GET /notifications`.
 *
 * !! This list has NO authorization scoping. The controller passes `{}` as the
 * query, so any authenticated user lists every notification in the collection,
 * including other people's. That predates this migration and is deliberately left
 * as-is here rather than silently narrowing what users see — but it needs fixing:
 * the list should be scoped to `req.session.user._id` (or a CASL query), and the
 * `userId` filter below should stop being a caller-supplied value.
 */
export const listQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("-createdAt", "createdAt").default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  userId: Joi.string().custom(objectIdValidation),
  status: Joi.string().trim().max(50),
});

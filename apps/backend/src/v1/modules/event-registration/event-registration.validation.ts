import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";

const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const createEventRegistrationBodySchema = Joi.object({
  eventId: Joi.string().custom(objectIdValidation).required().label("Event ID"),
});

export const updateEventRegistrationBodySchema = Joi.object({
  statusId: Joi.string().custom(objectIdValidation).required().label("Status ID"),
  feedback: Joi.string().trim().max(500).optional().allow("").label("Feedback"),
});

export const eventRegistrationListQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("-createdAt", "createdAt", "-updatedAt", "updatedAt").default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  search: Joi.string().trim().max(200).allow(""),

  eventId: Joi.string().custom(objectIdValidation).label("Event Filter"),
  userId: Joi.string().custom(objectIdValidation).label("User Filter"),
  statusId: Joi.string().custom(objectIdValidation).label("Status Filter"),
  createdAt: Joi.object({ gte: Joi.date().iso(), lte: Joi.date().iso() }),
})
  // The old schema declared `search`, but MongoQuery read `clientSearch` — which
  // this schema rejected. So search was unreachable here. Renaming keeps any
  // caller sending `search` working while the rest of the codebase stays on
  // `clientSearch`. `override` must be true: with it false, a caller sending both
  // keys gets a 400 rather than a search.
  .rename("search", "clientSearch", { ignoreUndefined: true, override: true });

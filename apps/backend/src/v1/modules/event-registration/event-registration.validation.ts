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
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  eventId: Joi.string().custom(objectIdValidation).optional().label("Event Filter"),
  userId: Joi.string().custom(objectIdValidation).optional().label("User Filter"),
  statusId: Joi.string().custom(objectIdValidation).optional().label("Status Filter"),
  search: Joi.string().trim().optional().allow(""),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

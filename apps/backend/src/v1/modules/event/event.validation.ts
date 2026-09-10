import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { EVENT_MODE_ENUMS, EVENT_TYPE_ENUMS } from "@rl/types";

// --- Reusable Validators ---

const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

// Reusable schema for AWS storage
const awsStorageSchema = Joi.object({
  Name: Joi.string().required().label("Image Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
});

// Reusable schema for Virtual Event Details
const virtualEventSchema = Joi.object({
  link: Joi.string().uri().required().label("Meeting Link"),
  id: Joi.string().allow("").optional().label("Meeting ID"),
  password: Joi.string().allow("").optional().label("Meeting Password"),
});

// --- Main Schemas ---

export const createEventBodySchema = Joi.object({
  organizers: Joi.array().items(Joi.string().custom(objectIdValidation)).min(1).required().label("Organizers"),

  title: Joi.string().trim().max(150).required().label("Title"),

  type: Joi.string()
    .valid(...Object.values(EVENT_TYPE_ENUMS))
    .required()
    .label("Event Type"),

  description: Joi.string().required().label("Description"),

  location: Joi.string().required().label("Location"),

  capacity: Joi.number().integer().min(1).required().label("Capacity"),

  // Date & Time
  startDate: Joi.date().iso().required().label("Start Date"),

  // Regex for HH:mm format (24h)
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({ "string.pattern.base": "Start time must be in HH:mm format" })
    .label("Start Time"),

  endDate: Joi.date().iso().min(Joi.ref("startDate")).required().label("End Date"),

  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({ "string.pattern.base": "End time must be in HH:mm format" })
    .label("End Time"),

  // Registration Deadline
  registrationEndDate: Joi.date().iso().max(Joi.ref("startDate")).required().label("Registration End Date"),

  bannerImageStorage: awsStorageSchema.optional().label("Banner Image Storage"),

  statusId: Joi.string().custom(objectIdValidation).required().label("Status ID"),

  mode: Joi.string()
    .valid(...Object.values(EVENT_MODE_ENUMS))
    .required()
    .label("Mode"),

  virtualEvent: Joi.when("mode", {
    is: Joi.valid(EVENT_MODE_ENUMS.VIRTUAL, EVENT_MODE_ENUMS.HYBRID),
    then: virtualEventSchema.required(),
    otherwise: virtualEventSchema.optional().allow(null),
  }).label("Virtual Event Details"),
});

export const updateEventBodySchema = Joi.object({
  organizers: Joi.array().items(Joi.string().custom(objectIdValidation)).min(1).optional(),
  title: Joi.string().trim().max(150).optional(),
  type: Joi.string()
    .valid(...Object.values(EVENT_TYPE_ENUMS))
    .optional(),
  description: Joi.string().optional(),
  location: Joi.string().optional(),
  capacity: Joi.number().integer().min(1).optional(),

  startDate: Joi.date().iso().optional(),
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),

  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),

  registrationEndDate: Joi.date().iso().optional(),

  bannerImageStorage: awsStorageSchema.optional(),

  statusId: Joi.string().custom(objectIdValidation).optional(),
  mode: Joi.string()
    .valid(...Object.values(EVENT_MODE_ENUMS))
    .optional(),

  virtualEvent: Joi.when("mode", {
    is: Joi.valid(EVENT_MODE_ENUMS.VIRTUAL, EVENT_MODE_ENUMS.HYBRID),
    then: virtualEventSchema.required(),
    otherwise: virtualEventSchema.optional(),
  }),
});

export const eventListQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string()
    .valid("-createdAt", "createdAt", "-startDate", "startDate", "title", "-title")
    .default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  search: Joi.string().trim().max(200).allow(""),

  statusId: Joi.string().custom(objectIdValidation),
  type: Joi.string().valid(...Object.values(EVENT_TYPE_ENUMS)),
  mode: Joi.string().valid(...Object.values(EVENT_MODE_ENUMS)),
  startDate: Joi.object({ gte: Joi.date().iso(), lte: Joi.date().iso() }),
})
  // The old schema declared `search`, but MongoQuery read `clientSearch` — which
  // this schema rejected. So search was unreachable here. Renaming keeps any
  // caller sending `search` working while the rest of the codebase stays on
  // `clientSearch`. `override` must be true: with it false, a caller sending both
  // keys gets a 400 rather than a search.
  .rename("search", "clientSearch", { ignoreUndefined: true, override: true });

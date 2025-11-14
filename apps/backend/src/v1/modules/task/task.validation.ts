import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { TASK_STATUS_ENUMS, TASK_PRIORITY_ENUMS } from "@inrm/types";

// Custom validation for MongoDB ObjectId
const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const createBodySchema = Joi.object({
  title: Joi.string().required().label("Title"),
  description: Joi.string().label("Description"),
  dueDate: Joi.date().label("Due Date"),
  status: Joi.string()
    .valid(...Object.values(TASK_STATUS_ENUMS))
    .label("Status"),
  statusChangedAt: Joi.date().label("Status Changed On"),
  duplicatedTask: Joi.array().items(Joi.string().custom(objectIdValidation)).max(50).label("Duplicated Task ID"),
  relatedTask: Joi.array().items(Joi.string().custom(objectIdValidation)).max(50).label("Related Task ID"),
  assignedTo: Joi.array().items(Joi.string().custom(objectIdValidation)).max(50).label("Assigned To"),
  relatedAudit: Joi.array().items(Joi.string().custom(objectIdValidation)).max(50).label("Related Audit ID"),
  relatedOrganisation: Joi.array()
    .items(Joi.string().custom(objectIdValidation))
    .max(50)
    .label("Related Organisation ID"),
  relatedQuotation: Joi.array().items(Joi.string().custom(objectIdValidation)).max(50).label("Related Quotation ID"),
  priority: Joi.string()
    .valid(...Object.values(TASK_PRIORITY_ENUMS))
    .label("Priority"),
  auditId: Joi.string().custom(objectIdValidation).label("Audit ID"),
  category: Joi.string().custom(objectIdValidation).optional().label("Category ID"),
});

export const updateBodySchema = Joi.object({
  title: Joi.string().optional().label("Title"),
  description: Joi.string().optional().label("Description"),
  dueDate: Joi.date().optional().label("Due Date"),
  status: Joi.string()
    .valid(...Object.values(TASK_STATUS_ENUMS))
    .optional()
    .label("Status"),
  statusChangedAt: Joi.date().optional().label("Status Changed On"),
  duplicatedTask: Joi.array()
    .items(Joi.string().custom(objectIdValidation))
    .max(50)
    .optional()
    .label("Duplicated Task ID"),
  relatedTask: Joi.array().items(Joi.string().custom(objectIdValidation)).max(50).optional().label("Related Task ID"),
  assignedTo: Joi.array().items(Joi.string().custom(objectIdValidation)).max(50).optional().label("Assigned To"),
  relatedAudit: Joi.array().items(Joi.string().custom(objectIdValidation)).max(50).label("Related Audit ID"),
  relatedOrganisation: Joi.array()
    .items(Joi.string().custom(objectIdValidation))
    .max(50)
    .label("Related Organisation ID"),
  relatedQuotation: Joi.array().items(Joi.string().custom(objectIdValidation)).max(50).label("Related Quotation ID"),
  priority: Joi.string()
    .valid(...Object.values(TASK_PRIORITY_ENUMS))
    .optional()
    .label("Priority"),
  auditId: Joi.string().custom(objectIdValidation).optional().label("Audit ID"),
  category: Joi.string().custom(objectIdValidation).optional().label("Category ID"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

export const subResourceCreateParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
  subResource: Joi.string()
    .valid("duplicatedTask", "relatedTask", "assignedTo", "relatedAudit", "relatedOrganisation", "relatedQuotation")
    .required()
    .label("Sub Resource"),
});

export const subResourceBodySchema = Joi.object({
  items: Joi.array().items(Joi.string().custom(objectIdValidation)).min(1).required().label("Items"),
});

export const subResourceRemoveParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
  subResource: Joi.string()
    .valid("duplicatedTask", "relatedTask", "assignedTo", "relatedAudit", "relatedOrganisation", "relatedQuotation")
    .required()
    .label("Sub Resource"),
  subResourceId: Joi.string().custom(objectIdValidation).required().label("Sub Resource ID"),
});

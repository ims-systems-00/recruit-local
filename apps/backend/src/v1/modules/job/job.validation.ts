import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import {
  WORKPLACE_ENUMS,
  WORKING_DAYS_ENUMS,
  EMPLOYMENT_TYPE,
  PERIOD_ENUMS,
  REQUIRED_DOCUMENTS_ENUMS,
} from "@rl/types";

const awsStorageSchema = Joi.object({
  Name: Joi.string().required().label("Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
})
  .unknown(true)
  .label("Storage File");

const workingHoursSchema = Joi.object({
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .label("Start Time"),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .label("End Time"),
}).label("Working Hours");

const educationSchema = Joi.object({
  degree: Joi.string().optional().label("Degree"),
  fieldOfStudy: Joi.string().optional().label("Field of Study"),
  gpa: Joi.string().optional().label("GPA"),
}).label("Education");

export const createBodySchema = Joi.object({
  title: Joi.string().required().label("Title"),
  description: Joi.string().optional().label("Description"),
  email: Joi.string().email().optional().label("Email"),
  number: Joi.string().optional().label("Contact Number"),
  aboutUs: Joi.string().optional().label("About Us"),
  autoFill: Joi.boolean().optional().label("Auto Fill"),
  category: Joi.string().optional().label("Category"),
  vacancy: Joi.number().integer().min(1).optional().label("Vacancy"),
  location: Joi.string().optional().label("Location"),
  responsibility: Joi.string().optional().label("Responsibility"),

  // Dates
  startDate: Joi.date().iso().optional().label("Start Date"),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional().label("End Date"),

  // Images & Files
  bannerStorage: awsStorageSchema.optional().label("Banner Storage"),
  attachmentsStorage: Joi.array().items(awsStorageSchema).optional().label("Attachments Storage"),

  // Enums
  workplace: Joi.string()
    .valid(...Object.values(WORKPLACE_ENUMS))
    .optional()
    .label("Workplace"),
  workingDays: Joi.number().optional().label("Working Days"),
  weekends: Joi.array()
    .items(Joi.string().valid(...Object.values(WORKING_DAYS_ENUMS)))
    .optional()
    .label("Weekends"),
  employmentType: Joi.string()
    .valid(...Object.values(EMPLOYMENT_TYPE))
    .optional()
    .label("Employment Type"),
  period: Joi.string()
    .valid(...Object.values(PERIOD_ENUMS))
    .optional()
    .label("Period"),
  requiredDocuments: Joi.array()
    .items(Joi.string().valid(...Object.values(REQUIRED_DOCUMENTS_ENUMS)))
    .optional()
    .label("Required Documents"),

  // Nested Complex Objects
  workingHours: workingHoursSchema.optional(),
  salary: Joi.number().optional().label("Salary"),
  minEducationalQualification: educationSchema.optional(),
  // System
  keywords: Joi.array().items(Joi.string()).optional().label("Keywords"),
});

export const updateBodySchema = Joi.object({
  title: Joi.string().optional().label("Title"),
  description: Joi.string().optional().label("Description"),
  category: Joi.string().optional().label("Category"),
  vacancy: Joi.number().integer().min(0).optional().label("Vacancy"),
  location: Joi.string().optional().label("Location"),
  responsibility: Joi.string().optional().label("Responsibility"),
  email: Joi.string().email().optional().label("Email"),
  number: Joi.string().optional().label("Contact Number"),
  aboutUs: Joi.string().optional().label("About Us"),
  autoFill: Joi.boolean().optional().label("Auto Fill"),
  startDate: Joi.date().iso().optional().label("Start Date"),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional().label("End Date"),

  bannerStorage: awsStorageSchema.optional().label("Banner Storage"),
  attachmentsStorage: Joi.array().items(awsStorageSchema).optional().label("Attachments Storage"),

  workplace: Joi.string()
    .valid(...Object.values(WORKPLACE_ENUMS))
    .optional()
    .label("Workplace"),
  workingDays: Joi.number().optional().label("Working Days"),
  weekends: Joi.array()
    .items(Joi.string().valid(...Object.values(WORKING_DAYS_ENUMS)))
    .optional()
    .label("Weekends"),
  employmentType: Joi.string()
    .valid(...Object.values(EMPLOYMENT_TYPE))
    .optional()
    .label("Employment Type"),

  period: Joi.string()
    .valid(...Object.values(PERIOD_ENUMS))
    .optional()
    .label("Period"),
  requiredDocuments: Joi.array()
    .items(Joi.string().valid(...Object.values(REQUIRED_DOCUMENTS_ENUMS)))
    .optional()
    .label("Required Documents"),

  workingHours: workingHoursSchema.optional(),
  salary: Joi.number().optional().label("Salary"),
  minEducationalQualification: educationSchema.optional(),
  keywords: Joi.array().items(Joi.string()).optional().label("Keywords"),
  statusId: Joi.string().custom(objectIdValidation).required().label("Status ID"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

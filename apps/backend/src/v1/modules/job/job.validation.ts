import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import {
  WORKPLACE_ENUMS,
  WORKING_DAYS_ENUMS,
  EMPLOYMENT_TYPE,
  PERIOD_ENUMS,
  REQUIRED_DOCUMENTS_ENUMS,
} from "@rl/types";

// --- Sub-Schemas for Nested Objects ---

// todo : awsStorageSchema can be moved to a common place
// Validation for AwsStorageTemplate
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
    .label("Start Time"), // Validates HH:MM
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .label("End Time"),
}).label("Working Hours");

const salarySchema = Joi.object({
  mode: Joi.string().required().label("Salary Mode"), // Required in Mongoose Schema
  amount: Joi.number().optional().label("Salary Amount"),
  min: Joi.number().optional().label("Minimum Salary"),
  max: Joi.number().optional().label("Maximum Salary"),
}).label("Salary");

const educationSchema = Joi.object({
  degree: Joi.string().optional().label("Degree"),
  fieldOfStudy: Joi.string().optional().label("Field of Study"),
  gpa: Joi.string().optional().label("GPA"),
}).label("Education");

const skillSchema = Joi.object({
  name: Joi.string().required().label("Skill Name"),
  years: Joi.number().optional().label("Years of Experience"),
}).label("Skill");

// --- Main Schemas ---

export const createBodySchema = Joi.object({
  // Basic Info
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

  // Images & Files (Split Src/Storage)
  bannerSrc: Joi.string().uri().optional().allow("").label("Banner Source"),
  bannerStorage: awsStorageSchema.optional().label("Banner Storage"),

  attachmentsSrc: Joi.array().items(Joi.string().uri()).optional().label("Attachments Source"),
  attachmentsStorage: Joi.array().items(awsStorageSchema).optional().label("Attachments Storage"),

  // Enums
  workplace: Joi.string()
    .valid(...Object.values(WORKPLACE_ENUMS))
    .optional()
    .label("Workplace"),
  workingDays: Joi.array()
    .items(Joi.string().valid(...Object.values(WORKING_DAYS_ENUMS)))
    .optional()
    .label("Working Days"),
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
  salary: salarySchema.optional(),
  minEducationalQualification: educationSchema.optional(),
  skills: Joi.array().items(skillSchema).optional().label("Skills"),

  // System
  keywords: Joi.array().items(Joi.string()).optional().label("Keywords"),
  status: Joi.string().optional().label("Status"),
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

  bannerSrc: Joi.string().uri().optional().allow("").label("Banner Source"),
  bannerStorage: awsStorageSchema.optional().label("Banner Storage"),

  attachmentsSrc: Joi.array().items(Joi.string().uri()).optional().label("Attachments Source"),
  attachmentsStorage: Joi.array().items(awsStorageSchema).optional().label("Attachments Storage"),

  workplace: Joi.string()
    .valid(...Object.values(WORKPLACE_ENUMS))
    .optional()
    .label("Workplace"),
  workingDays: Joi.array()
    .items(Joi.string().valid(...Object.values(WORKING_DAYS_ENUMS)))
    .optional()
    .label("Working Days"),
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
  salary: salarySchema.optional(),
  minEducationalQualification: educationSchema.optional(),
  skills: Joi.array().items(skillSchema).optional().label("Skills"),

  keywords: Joi.array().items(Joi.string()).optional().label("Keywords"),
  status: Joi.string().optional().label("Status"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

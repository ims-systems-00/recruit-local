import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import {
  WORKPLACE_ENUMS,
  WORKING_DAYS_ENUMS,
  EMPLOYMENT_TYPE,
  PERIOD_ENUMS,
  REQUIRED_DOCUMENTS_ENUMS,
  JOBS_STATUS_ENUMS,
  QUERY_TYPE_ENUMS,
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

// Added sub-schema for the queries
const additionalQuerySchema = Joi.object({
  question: Joi.string().required().label("Question"),
  type: Joi.string()
    .valid(...Object.values(QUERY_TYPE_ENUMS))
    .required()
    .label("Query Type"),
  options: Joi.array()
    .items(Joi.string())
    .when("type", {
      is: Joi.valid(QUERY_TYPE_ENUMS.SINGLE_CHOICE, QUERY_TYPE_ENUMS.MULTIPLE_CHOICE),
      then: Joi.array().min(1).required(),
      otherwise: Joi.forbidden(),
    })
    .label("Options"),
  isRequired: Joi.boolean().default(false).label("Is Required"),
  expectedAnswer: Joi.string().optional().allow("").label("Expected Answer"),
}).label("Additional Query");

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
  locationAdditionalInfo: Joi.string().optional().label("Location Additional Info"),
  responsibility: Joi.string().optional().label("Responsibility"),
  yearOfExperience: Joi.number().integer().min(0).optional().label("Years of Experience"),

  // Dates
  endDate: Joi.date().iso().optional().label("Start Date"),

  // Images & Files
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

  // System
  keywords: Joi.array().items(Joi.string()).optional().label("Keywords"),

  // --- NEW FIELDS ---
  formId: Joi.string().custom(objectIdValidation).optional().label("Form ID"),
  additionalQueries: Joi.array().items(additionalQuerySchema).optional().label("Additional Queries"),
});

export const updateBodySchema = Joi.object({
  title: Joi.string().optional().label("Title"),
  description: Joi.string().optional().label("Description"),
  category: Joi.string().optional().label("Category"),
  vacancy: Joi.number().integer().min(0).optional().label("Vacancy"),
  location: Joi.string().optional().label("Location"),
  locationAdditionalInfo: Joi.string().optional().label("Location Additional Info"),
  responsibility: Joi.string().optional().label("Responsibility"),
  email: Joi.string().email().optional().label("Email"),
  number: Joi.string().optional().label("Contact Number"),
  aboutUs: Joi.string().optional().label("About Us"),
  autoFill: Joi.boolean().optional().label("Auto Fill"),
  endDate: Joi.date().iso().optional().label("Start Date"),
  attachmentsStorage: Joi.array().items(awsStorageSchema).optional().label("Attachments Storage"),
  yearOfExperience: Joi.number().integer().min(0).optional().label("Years of Experience"),
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
  keywords: Joi.array().items(Joi.string()).optional().label("Keywords"),

  status: Joi.string()
    .valid(...Object.values(JOBS_STATUS_ENUMS))
    .optional()
    .label("Job Status"),

  // --- NEW FIELDS ---
  formId: Joi.string().custom(objectIdValidation).optional().label("Form ID"),
  additionalQueries: Joi.array().items(additionalQuerySchema).optional().label("Additional Queries"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * Accepts a bare value or the `{ in: [...] }` shape the frontend sends through
 * qs brackets: `?employmentType[in][]=full-time&employmentType[in][]=contract`.
 */
const inList = (values: string[]) =>
  Joi.alternatives().try(
    Joi.string().valid(...values),
    Joi.object({
      in: Joi.array()
        .items(Joi.string().valid(...values))
        .single(),
    })
  );

const numericRange = Joi.object({ gte: Joi.number(), lte: Joi.number() });

/**
 * The contract for `GET /jobs` and `GET /public/jobs`.
 *
 * Joi objects reject unknown keys, which is the point: before this, a typo'd param
 * became a `$match` clause and the endpoint quietly returned nothing.
 */
export const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string()
    .valid("-createdAt", "createdAt", "-updatedAt", "updatedAt", "-salary", "salary", "-endDate", "endDate")
    .default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  // Escape hatch: `?semantic=false` runs keyword-only, for comparing result sets.
  semantic: Joi.boolean().default(true),
  matched: Joi.boolean(),

  status: Joi.string().valid(...Object.values(JOBS_STATUS_ENUMS)),
  category: Joi.string().trim().max(100),
  employmentType: inList(Object.values(EMPLOYMENT_TYPE)),
  workplace: inList(Object.values(WORKPLACE_ENUMS)),
  period: inList(Object.values(PERIOD_ENUMS)),
  salary: numericRange,
  yearOfExperience: numericRange,

  // The frontend sends this, but Job has no `salaryMode` field — it has only ever
  // matched nothing. Accept and drop rather than 400 a page that works today.
  salaryMode: Joi.any().strip(),
});

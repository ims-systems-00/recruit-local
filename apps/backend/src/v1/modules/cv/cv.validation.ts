import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import { CV_STATUS_ENUM } from "@rl/types";

const subDocId = Joi.string().custom(objectIdValidation).optional().label("Sub-doc ID");

const awsStorageSchema = Joi.object({
  Name: Joi.string().required().label("Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
}).label("AWS Storage");

const pdfStorageSchema = awsStorageSchema
  .keys({
    Name: Joi.string()
      .pattern(/\.pdf$/i)
      .required()
      .label("Name")
      .messages({ "string.pattern.base": "Only PDF files are allowed for CV resume upload." }),
  })
  .label("PDF Storage");

const skillSchema = Joi.object({
  _id: subDocId,
  name: Joi.string().required().label("Skill Name"),
  proficiencyLevel: Joi.string().optional().allow("").label("Proficiency Level"),
  description: Joi.string().optional().allow("").label("Skill Description"),
});

const educationSchema = Joi.object({
  _id: subDocId,
  institution: Joi.string().required().label("Institution"),
  degree: Joi.string().required().label("Degree"),
  fieldOfStudy: Joi.string().required().label("Field of Study"),
  startDate: Joi.date().required().label("Start Date"),
  endDate: Joi.date().optional().allow(null).label("End Date"),
  description: Joi.string().optional().allow("").label("Education Description"),
  grade: Joi.string().optional().allow("").label("Grade"),
});

const experienceSchema = Joi.object({
  _id: subDocId,
  jobTitle: Joi.string().required().label("Job Title"),
  company: Joi.string().required().label("Company"),
  location: Joi.string().optional().allow("").label("Location"),
  workplace: Joi.string().optional().allow("").label("Workplace"),
  employmentType: Joi.string().optional().allow("").label("Employment Type"),
  startDate: Joi.date().required().label("Start Date"),
  endDate: Joi.date().optional().allow(null).label("End Date"),
  description: Joi.string().optional().allow("").label("Experience Description"),
  isActive: Joi.boolean().optional().label("Is Active"),
});

const interestSchema = Joi.object({
  _id: subDocId,
  name: Joi.string().required().label("Interest Name"),
  description: Joi.string().optional().allow("").label("Interest Description"),
});

export const createBodySchema = Joi.object({
  title: Joi.string().optional().label("CV Title").default("Untitled CV"),
  jobProfileId: Joi.string().custom(objectIdValidation).required().label("Job Profile ID"),

  summary: Joi.string().optional().label("Summary"),
  name: Joi.string().optional().label("Name"),
  email: Joi.string().email().optional().label("Email"),
  phone: Joi.string().optional().label("Phone"),
  address: Joi.string().optional().label("Address"),

  imageStorage: awsStorageSchema.optional(),
  resumeStorage: pdfStorageSchema.optional(),

  // Arrays (Optional on create, but must follow schema if provided)
  experience: Joi.array().items(experienceSchema).optional().label("Experience"),
  education: Joi.array().items(educationSchema).optional().label("Education"),
  skills: Joi.array().items(skillSchema).optional().label("Skills"),
  interests: Joi.array().items(interestSchema).optional().label("Interests"),

  // Settings
  templateId: Joi.string().optional().label("Template ID"),
  colorProfile: Joi.string().optional().label("Color Profile"),
  status: Joi.string()
    .valid(...Object.values(CV_STATUS_ENUM))
    .optional()
    .label("CV Status"),
});

export const updateBodySchema = Joi.object({
  title: Joi.string().optional().label("CV Title"),
  summary: Joi.string().optional().allow("").label("Summary"),
  name: Joi.string().optional().allow("").label("Name"),
  email: Joi.string().email().optional().allow("").label("Email"),
  phone: Joi.string().optional().allow("").label("Phone"),
  address: Joi.string().optional().allow("").label("Address"),

  imageStorage: awsStorageSchema.optional().allow(null),
  resumeStorage: pdfStorageSchema.optional().allow(null),

  // In the "Single Update" approach, passing these arrays replaces the existing ones.
  experience: Joi.array().items(experienceSchema).optional(),
  education: Joi.array().items(educationSchema).optional(),
  skills: Joi.array().items(skillSchema).optional(),
  interests: Joi.array().items(interestSchema).optional(),

  // Settings
  templateId: Joi.string().optional(),
  colorProfile: Joi.string().optional(),
  status: Joi.string()
    .valid(...Object.values(CV_STATUS_ENUM))
    .optional()
    .label("CV Status"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("CV ID"),
});

const empty = Joi.valid("");

const extractionSchemaSchema = Joi.object({
  name: empty.optional().label("Name"),
  email: empty.optional().label("Email"),
  phone: empty.optional().label("Phone"),
  address: empty.optional().label("Address"),
  contactNumber: empty.optional().label("Contact Number"),
  summary: empty.optional().label("Summary"),
  portfolioUrl: empty.optional().label("Portfolio URL"),
  jobTitle: Joi.array().items(empty).optional().label("Job Title"),
  industry: Joi.array().items(empty).optional().label("Industry"),
  keywords: Joi.array().items(empty).optional().label("Keywords"),
  languages: Joi.array()
    .items(Joi.object({ name: empty.optional(), proficiencyLevel: empty.optional() }))
    .optional()
    .label("Languages"),
  experience: Joi.array()
    .items(
      Joi.object({
        jobTitle: empty.optional(),
        company: empty.optional(),
        location: empty.optional(),
        workplace: empty.optional(),
        employmentType: empty.optional(),
        startDate: empty.optional(),
        endDate: empty.optional(),
        description: empty.optional(),
        isActive: empty.optional(),
      })
    )
    .optional()
    .label("Experience"),
  education: Joi.array()
    .items(
      Joi.object({
        institution: empty.optional(),
        degree: empty.optional(),
        fieldOfStudy: empty.optional(),
        startDate: empty.optional(),
        endDate: empty.optional(),
        description: empty.optional(),
        grade: empty.optional(),
      })
    )
    .optional()
    .label("Education"),
  skills: Joi.array()
    .items(Joi.object({ name: empty.optional(), proficiencyLevel: empty.optional(), description: empty.optional() }))
    .optional()
    .label("Skills"),
  interests: Joi.array()
    .items(Joi.object({ name: empty.optional(), description: empty.optional() }))
    .optional()
    .label("Interests"),
}).label("Extraction Schema");

export const extractAndCreateBodySchema = Joi.object({
  resumeStorage: pdfStorageSchema.required(),
  schema: extractionSchemaSchema.required(),
});

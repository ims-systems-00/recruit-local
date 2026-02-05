import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import { CV_STATUS_ENUM } from "@rl/types";

const subDocId = Joi.string().custom(objectIdValidation).optional().label("Sub-doc ID");

const awsStorageSchema = Joi.object({
  Name: Joi.string().required().label("Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
}).label("AWS Storage");

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
  workMode: Joi.string().optional().allow("").label("Work Mode"),
  employmentType: Joi.string().optional().allow("").label("Employment Type"),
  position: Joi.string().required().label("Position"),
  startDate: Joi.date().required().label("Start Date"),
  endDate: Joi.date().optional().allow(null).label("End Date"),
  description: Joi.string().optional().allow("").label("Experience Description"),
});

const interestSchema = Joi.object({
  _id: subDocId,
  name: Joi.string().required().label("Interest Name"),
  description: Joi.string().optional().allow("").label("Interest Description"),
});

export const createBodySchema = Joi.object({
  title: Joi.string().required().label("CV Title").default("Untitled CV"),
  jobProfileId: Joi.string().custom(objectIdValidation).required().label("Job Profile ID"),

  summary: Joi.string().optional().label("Summary"),
  name: Joi.string().optional().label("Name"),
  email: Joi.string().email().optional().label("Email"),
  phone: Joi.string().optional().label("Phone"),
  address: Joi.string().optional().label("Address"),
  imageSrc: Joi.string().uri().optional().label("Image Source"),
  imageStorage: awsStorageSchema.optional(),

  // Arrays (Optional on create, but must follow schema if provided)
  experience: Joi.array().items(experienceSchema).optional().label("Experience"),
  education: Joi.array().items(educationSchema).optional().label("Education"),
  skills: Joi.array().items(skillSchema).optional().label("Skills"),
  interests: Joi.array().items(interestSchema).optional().label("Interests"),

  // Settings
  templateId: Joi.string().optional().label("Template ID"),
  colorProfile: Joi.string().optional().label("Color Profile"),
  statusId: Joi.string().custom(objectIdValidation).optional().label("Status"),
});

export const updateBodySchema = Joi.object({
  title: Joi.string().optional().label("CV Title"),
  jobProfileId: Joi.string().custom(objectIdValidation).optional().label("Job Profile ID"),

  summary: Joi.string().optional().allow("").label("Summary"),
  name: Joi.string().optional().allow("").label("Name"),
  email: Joi.string().email().optional().allow("").label("Email"),
  phone: Joi.string().optional().allow("").label("Phone"),
  address: Joi.string().optional().allow("").label("Address"),
  imageSrc: Joi.string().uri().optional().allow("").label("Image Source"),
  imageStorage: awsStorageSchema.optional(),

  // In the "Single Update" approach, passing these arrays replaces the existing ones.
  // Validation ensures that if you send the array, every item inside is valid.
  experience: Joi.array().items(experienceSchema).optional(),
  education: Joi.array().items(educationSchema).optional(),
  skills: Joi.array().items(skillSchema).optional(),
  interests: Joi.array().items(interestSchema).optional(),

  // Settings
  templateId: Joi.string().optional(),
  colorProfile: Joi.string().optional(),
  statusId: Joi.string()
    .valid(...Object.values(CV_STATUS_ENUM))
    .optional(),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("CV ID"),
});

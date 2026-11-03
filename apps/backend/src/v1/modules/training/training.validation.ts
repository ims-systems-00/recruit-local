import Joi from "joi";
import { TRAINING_SKILLS_MAX } from "@rl/types";
import { objectIdValidation } from "../../../common/helper/validate";

const awsStorageSchema = Joi.object({
  Name: Joi.string().required().label("File Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
}).label("AWS Storage");

// Skill catalogue ids, in the order picked. That each one is a live catalogue
// entry is checked against the catalogue by the service.
const skillsSchema = Joi.array()
  .items(Joi.string().custom(objectIdValidation).label("Skill"))
  .min(1)
  .max(TRAINING_SKILLS_MAX)
  .unique()
  .label("Skills");

const endDateMessages = { "date.min": "End Date must be on or after the Start Date" };

// While enrolled there is no end date yet, so one sent anyway is dropped.
const enrolledEndDate = Joi.any().strip();

export const createBodySchema = Joi.object({
  jobProfileId: Joi.string().custom(objectIdValidation).required().label("Job Profile ID"),
  organizationName: Joi.string().trim().max(200).required().label("Organization Name"),
  courseName: Joi.string().trim().max(200).required().label("Course Name"),
  skills: skillsSchema.required(),
  isCurrentlyEnrolled: Joi.boolean().default(false).label("Currently Enrolled"),
  startDate: Joi.date().required().label("Start Date"),
  endDate: Joi.when("isCurrentlyEnrolled", {
    is: true,
    then: enrolledEndDate,
    otherwise: Joi.date().min(Joi.ref("startDate")).required().messages(endDateMessages),
  }).label("End Date"),
  certificateStorage: awsStorageSchema.optional().label("Certificate File Data"),
});

/**
 * Partial update. The end date is checked against a start date sent in the same
 * body; the edit form always sends both.
 */
export const updateBodySchema = Joi.object({
  organizationName: Joi.string().trim().max(200).optional().label("Organization Name"),
  courseName: Joi.string().trim().max(200).optional().label("Course Name"),
  skills: skillsSchema.optional(),
  isCurrentlyEnrolled: Joi.boolean().optional().label("Currently Enrolled"),
  startDate: Joi.date().optional().label("Start Date"),
  endDate: Joi.when("isCurrentlyEnrolled", {
    is: true,
    then: enrolledEndDate,
    otherwise: Joi.when("startDate", {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref("startDate")).messages(endDateMessages),
      otherwise: Joi.date(),
    }),
  }).label("End Date"),
  // A new upload replaces the certificate; null removes it; absent keeps it.
  certificateStorage: awsStorageSchema.allow(null).optional().label("Certificate File Data"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * The contract for `GET /trainings`.
 *
 * Joi objects reject unknown keys, which is the point: a typo'd param would
 * otherwise become a `$match` clause and the endpoint would quietly return nothing.
 */
export const listQuerySchema = Joi.object({
  // Forward-only cursor from the previous response's `pagination.nextCursor`.
  cursor: Joi.string().trim().max(512),
  // Removed: paging is by cursor. Accepted and dropped rather than 400'ing a
  // caller that still sends it.
  page: Joi.any().strip(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string()
    .valid("-startDate", "startDate", "-endDate", "endDate", "-createdAt", "createdAt")
    .default("-startDate"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  jobProfileId: Joi.string().custom(objectIdValidation),
  organizationName: Joi.string().trim().max(200),
  startDate: Joi.object({ gte: Joi.date().iso(), lte: Joi.date().iso() }),
});

import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import { WORKPLACE_ENUMS, EMPLOYMENT_TYPE } from "@rl/types";

export const createBodySchema = Joi.object({
  jobProfileId: Joi.string().custom(objectIdValidation).required().label("Job Profile ID"),
  company: Joi.string().required().label("Company"),
  jobTitle: Joi.string().required().label("Job Title"),
  location: Joi.string().optional().label("Location"),
  workplace: Joi.string()
    .valid(...Object.values(WORKPLACE_ENUMS))
    .optional()
    .label("Workplace"),
  employmentType: Joi.string()
    .valid(...Object.values(EMPLOYMENT_TYPE))
    .optional()
    .label("Employment Type"),
  startDate: Joi.date().optional().label("Start Date"),
  endDate: Joi.date().optional().label("End Date"),
  description: Joi.string().optional().label("Description"),
  isActive: Joi.boolean().optional().label("Is Active"),
});

export const updateBodySchema = Joi.object({
  company: Joi.string().optional().label("Company"),
  jobTitle: Joi.string().optional().label("Job Title"),
  workplace: Joi.string()
    .valid(...Object.values(WORKPLACE_ENUMS))
    .optional()
    .label("Workplace"),
  employmentType: Joi.string()
    .valid(...Object.values(EMPLOYMENT_TYPE))
    .optional()
    .label("Employment Type"),
  location: Joi.string().optional().label("Location"),
  startDate: Joi.date().optional().label("Start Date"),
  endDate: Joi.date().optional().label("End Date"),
  description: Joi.string().optional().label("Description"),
  isActive: Joi.boolean().optional().label("Is Active"),
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

/**
 * The contract for `GET /experiences`.
 *
 * Joi objects reject unknown keys, which is the point: before this a typo'd param
 * became a `$match` clause and the endpoint quietly returned nothing.
 */
export const listQuerySchema = Joi.object({
  // Forward-only cursor from the previous response's `pagination.nextCursor`.
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page. Kept because the frontend still sends `page: … || 1`.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string()
    .valid("-startDate", "startDate", "-endDate", "endDate", "-createdAt", "createdAt")
    .default("-startDate"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  jobProfileId: Joi.string().custom(objectIdValidation),
  workplace: inList(Object.values(WORKPLACE_ENUMS)),
  employmentType: inList(Object.values(EMPLOYMENT_TYPE)),
  isActive: Joi.boolean(),
  startDate: Joi.object({ gte: Joi.date().iso(), lte: Joi.date().iso() }),
});

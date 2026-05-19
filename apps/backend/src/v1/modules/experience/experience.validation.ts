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

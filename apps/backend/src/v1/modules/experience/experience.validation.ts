import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

export const createBodySchema = Joi.object({
  jobProfileId: Joi.string().custom(objectIdValidation).required().label("Job Profile ID"),
  company: Joi.string().required().label("Company"),
  position: Joi.string().required().label("Position"),
  location: Joi.string().optional().label("Location"),
  startDate: Joi.date().optional().label("Start Date"),
  endDate: Joi.date().optional().label("End Date"),
  description: Joi.string().optional().label("Description"),
});

export const updateBodySchema = Joi.object({
  company: Joi.string().optional().label("Company"),
  position: Joi.string().optional().label("Position"),
  location: Joi.string().optional().label("Location"),
  startDate: Joi.date().optional().label("Start Date"),
  endDate: Joi.date().optional().label("End Date"),
  description: Joi.string().optional().label("Description"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

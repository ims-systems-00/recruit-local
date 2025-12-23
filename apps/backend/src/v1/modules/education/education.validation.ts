import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

export const createBodySchema = Joi.object({
  institution: Joi.string().required().label("Institution"),
  degree: Joi.string().required().label("Degree"),
  fieldOfStudy: Joi.string().optional().label("Field of Study"),
  startDate: Joi.date().optional().label("Start Date"),
  endDate: Joi.date().optional().label("End Date"),
  grade: Joi.string().optional().label("Grade"),
  description: Joi.string().optional().label("Description"),
});

export const updateBodySchema = Joi.object({
  institution: Joi.string().optional().label("Institution"),
  degree: Joi.string().optional().label("Degree"),
  fieldOfStudy: Joi.string().optional().label("Field of Study"),
  startDate: Joi.date().optional().label("Start Date"),
  endDate: Joi.date().optional().label("End Date"),
  grade: Joi.string().optional().label("Grade"),
  description: Joi.string().optional().label("Description"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

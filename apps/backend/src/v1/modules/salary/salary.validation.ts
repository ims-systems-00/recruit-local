import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

export const createBodySchema = Joi.object({
  jobTitle: Joi.string().min(2).max(200).required().label("Job Title"),
  location: Joi.string().min(2).max(200).required().label("Location"),
  experienceLevel: Joi.string().min(2).max(100).required().label("Experience Level"),
  minSalary: Joi.number().min(0).required().label("Min Salary"),
  maxSalary: Joi.number().min(0).required().label("Max Salary"),
  currency: Joi.string().min(1).max(10).required().label("Currency"),
});

export const updateBodySchema = Joi.object({
  jobTitle: Joi.string().min(2).max(200).optional().label("Job Title"),
  location: Joi.string().min(2).max(200).optional().label("Location"),
  experienceLevel: Joi.string().min(2).max(100).optional().label("Experience Level"),
  minSalary: Joi.number().min(0).optional().label("Min Salary"),
  maxSalary: Joi.number().min(0).optional().label("Max Salary"),
  currency: Joi.string().min(1).max(10).optional().label("Currency"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

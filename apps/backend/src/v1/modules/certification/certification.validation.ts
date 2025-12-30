import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

export const createBodySchema = Joi.object({
  jobProfileId: Joi.string().custom(objectIdValidation).required().label("Job Profile ID"),
  title: Joi.string().required().label("Title"),
  issuingOrganization: Joi.string().required().label("Issuing Organization"),
  issueDate: Joi.date().required().label("Issue Date"),
  Name: Joi.string().required().label("Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
});

export const updateBodySchema = Joi.object({
  name: Joi.string().optional().label("Name"),
  issuingOrganization: Joi.string().optional().label("Issuing Organization"),
  issueDate: Joi.date().optional().label("Issue Date"),
  Name: Joi.string().required().label("Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

const awsStorageSchema = Joi.object({
  Name: Joi.string().required().label("File Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
}).label("AWS Storage");

export const createBodySchema = Joi.object({
  jobProfileId: Joi.string().custom(objectIdValidation).required().label("Job Profile ID"),
  title: Joi.string().required().label("Title"),
  issuingOrganization: Joi.string().required().label("Issuing Organization"),
  issueDate: Joi.date().required().label("Issue Date"),
  imageStorage: awsStorageSchema.optional().label("Image File Data"),
});

export const updateBodySchema = Joi.object({
  title: Joi.string().optional().label("Title"),
  issuingOrganization: Joi.string().optional().label("Issuing Organization"),
  issueDate: Joi.date().optional().label("Issue Date"),
  imageStorage: awsStorageSchema.optional().label("Image File Data"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

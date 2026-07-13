import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";
import { POST_TYPE_ENUMS, POST_STATUS_ENUMS } from "@rl/types";

// Inline AWS upload template accepted on writes (banner + images); the service
// turns each into a FileMedia ref. Mirrors the job-profile upload technique.
const awsStorageSchema = Joi.object({
  Name: Joi.string().label("Name"),
  Bucket: Joi.string().label("Bucket"),
  Key: Joi.string().label("Key"),
}).allow(null);

export const createPostBodySchema = Joi.object({
  title: Joi.string().required().label("Title"),
  text: Joi.string().required().label("Text"),
  keywords: Joi.array().items(Joi.string()).optional().label("Keywords"),
  type: Joi.string()
    .valid(...Object.values(POST_TYPE_ENUMS))
    .optional()
    .label("Type"),
  status: Joi.string()
    .valid(...Object.values(POST_STATUS_ENUMS))
    .optional()
    .label("Status"),
  schedule: Joi.date().optional().label("Schedule"),
  bannerStorage: awsStorageSchema.label("Banner Storage"),
  imagesStorage: Joi.array().items(awsStorageSchema).optional().label("Images Storage"),
});

export const updatePostBodySchema = Joi.object({
  title: Joi.string().optional().label("Title"),
  text: Joi.string().optional().label("Text"),
  keywords: Joi.array().items(Joi.string()).optional().label("Keywords"),
  type: Joi.string()
    .valid(...Object.values(POST_TYPE_ENUMS))
    .optional()
    .label("Type"),
  status: Joi.string()
    .valid(...Object.values(POST_STATUS_ENUMS))
    .optional()
    .label("Status"),
  schedule: Joi.date().optional().label("Schedule"),
  bannerStorage: awsStorageSchema.label("Banner Storage"),
  imagesStorage: Joi.array().items(awsStorageSchema).optional().label("Images Storage"),
});

export const postIdParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("Post ID"),
});

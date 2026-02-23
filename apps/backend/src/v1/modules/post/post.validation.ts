import Joi from "joi";
import { objectIdValidation } from "../../../common/helper/validate";

export const awsStorageSchema = Joi.object({
  Name: Joi.string().required().label("Name"),
  Bucket: Joi.string().required().label("Bucket"),
  Key: Joi.string().required().label("Key"),
});

export const createPostBodySchema = Joi.object({
  title: Joi.string().required().label("Title"),
  content: Joi.string().required().label("Content"),
  images: Joi.array()
    .items(
      Joi.object({
        storage: awsStorageSchema.required().label("Storage Details"),
      })
    )
    .optional()
    .label("Images"),
  tags: Joi.array().items(Joi.string()).optional().label("Tags"),
  statusId: Joi.string().custom(objectIdValidation).required().label("Status ID"),
});

export const updatePostBodySchema = Joi.object({
  title: Joi.string().optional().label("Title"),
  content: Joi.string().optional().label("Content"),
  images: Joi.array()
    .items(
      Joi.object({
        storage: awsStorageSchema.required().label("Storage Details"),
      })
    )
    .optional()
    .label("Images"),
  tags: Joi.array().items(Joi.string()).optional().label("Tags"),
  statusId: Joi.string().custom(objectIdValidation).optional().label("Status ID"),
});

export const postIdParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("Post ID"),
});

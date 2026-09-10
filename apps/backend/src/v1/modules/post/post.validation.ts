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

/**
 * The contract for `GET /posts`.
 *
 * `matched` switches modes rather than filters, so the controller reads it
 * directly — the builder only ever sees the keys `postListQuerySpec` declares.
 */
export const listQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page. Kept because the frontend still sends `page: … || 1`.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("-createdAt", "createdAt", "-updatedAt", "updatedAt").default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  matched: Joi.boolean(),

  tenantId: Joi.string().custom(objectIdValidation),
  jobProfileId: Joi.string().custom(objectIdValidation),
  type: Joi.string().valid(...Object.values(POST_TYPE_ENUMS)),
  status: Joi.string().valid(...Object.values(POST_STATUS_ENUMS)),

  // The frontend sends this, but Post has no `statusId` field — it has `status`, an
  // enum. It matched nothing under MongoQuery either, so this filter has never done
  // anything. Accept and drop rather than 400 a screen that renders today. Remove
  // once the frontend stops sending it.
  statusId: Joi.any().strip(),
});

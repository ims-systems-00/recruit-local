import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import { modelNames } from "../../../models/constants";
import { VISIBILITY_ENUM } from "@rl/types";

const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

const validModelNames = Object.values(modelNames);
const validVisibilities = Object.values(VISIBILITY_ENUM);

export const createBodySchema = Joi.object({
  collectionName: Joi.string()
    .valid(...validModelNames)
    .required()
    .label("Collection Name"),

  collectionDocument: Joi.string().required().custom(objectIdValidation).label("Collection Document"),

  storageInformation: Joi.object<AwsStorageTemplate>({
    Name: Joi.string().required(),
    Key: Joi.string().required(),
    Bucket: Joi.string().required(),
  })
    .required()
    .label("Storage Information"),

  thumbnail: Joi.object<AwsStorageTemplate>({
    Name: Joi.string().required(),
    Key: Joi.string().required(),
    Bucket: Joi.string().required(),
  })
    .optional()
    .label("Thumbnail"),

  visibility: Joi.string()
    .valid(...validVisibilities)
    .required()
    .label("Visibility"),
});

export const updateBodySchema = Joi.object({
  collectionName: Joi.string()
    .valid(...validModelNames)
    .optional()
    .label("Collection Name"),

  collectionDocument: Joi.string().optional().custom(objectIdValidation).label("Collection Document"),

  storageInformation: Joi.object<AwsStorageTemplate>({
    Name: Joi.string(),
    Key: Joi.string(),
    Bucket: Joi.string(),
  })
    .optional()
    .label("Storage Information"),

  thumbnail: Joi.object<AwsStorageTemplate>({
    Name: Joi.string(),
    Key: Joi.string(),
    Bucket: Joi.string(),
  })
    .optional()
    .label("Thumbnail"),

  visibility: Joi.string()
    .valid(...validVisibilities)
    .optional()
    .label("Visibility"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

/**
 * The contract for `GET /file-medias`.
 *
 * Joi objects reject unknown keys, which is the point: before this a typo'd param
 * became a `$match` clause and the endpoint quietly returned nothing.
 */
export const listQuerySchema = Joi.object({
  cursor: Joi.string().trim().max(512),
  // Deprecated. Sending it returns the legacy offset block; omitting it returns a
  // cursor page. Kept because the frontend still sends `page: … || 1`.
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid("-createdAt", "createdAt", "-updatedAt", "updatedAt").default("-createdAt"),

  clientSearch: Joi.string().trim().max(200).allow(""),
  search: Joi.string().trim().max(200).allow(""),
  collectionName: Joi.string().trim().max(100),
  collectionDocument: Joi.string().custom(objectIdValidation),
  visibility: Joi.string().valid(...Object.values(VISIBILITY_ENUM)),
})
  // The frontend sends `search`; everything downstream reads `clientSearch`, so
  // rename rather than teach the pipeline a second key. `override` must be true:
  // with Joi's default of false, a caller sending both keys gets a 400.
  .rename("search", "clientSearch", { ignoreUndefined: true, override: true });

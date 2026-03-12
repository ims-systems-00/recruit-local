import * as yup from 'yup';
import {
  objectIdSchema,
  storageInformationSchema,
  deleteMarkerSchema,
  validVisibilities,
} from './shared.schema';

// The core model
export const fileMediaSchema = yup.object({
  _id: objectIdSchema.required(),
  collectionName: yup.string().required(),
  collectionDocument: objectIdSchema.required(),
  storageInformation: storageInformationSchema.required(),
  visibility: yup.string().oneOf(validVisibilities).required(),
  deleteMarker: deleteMarkerSchema.required(),
  createdAt: yup.string().required(),
  updatedAt: yup.string().required(),
  src: yup.string().nullable().default(null),
});

export const paginationSchema = yup.object({
  totalDocs: yup.number().required(),
  limit: yup.number().required(),
  totalPages: yup.number().required(),
  page: yup.number().required(),
  pagingCounter: yup.number().required(),
  hasPrevPage: yup.boolean().required(),
  hasNextPage: yup.boolean().required(),
  prevPage: yup.number().nullable().defined(),
  nextPage: yup.number().nullable().defined(),
  total: yup.number().optional(),
});

// The Backend "Envelope" for Lists
export const fileMediaListResponseSchema = yup.object({
  fileMedias: yup.array().of(fileMediaSchema).required(),
  pagination: paginationSchema.required(),
  message: yup.string().optional(),
});

// The Backend "Envelope" for Single Items
export const fileMediaItemResponseSchema = yup.object({
  fileMedia: fileMediaSchema.required(),
  message: yup.string().optional(),
});

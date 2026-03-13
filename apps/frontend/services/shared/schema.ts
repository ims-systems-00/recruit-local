import * as yup from 'yup';
import { VISIBILITY_ENUM, modelNames } from '@rl/types';

export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const validModelNames = Object.values(modelNames);
export const validVisibilities = Object.values(VISIBILITY_ENUM);

export const objectIdSchema = yup.string().matches(objectIdRegex, {
  message: '${path} must be a valid 24-character hex ID',
  excludeEmptyString: true,
});

export const storageInformationSchema = yup.object({
  Name: yup.string().required('File name is required'),
  Key: yup.string().required('Storage key/path is required'),
  Bucket: yup.string().required('Bucket name is required'),
});

export const deleteMarkerSchema = yup.object({
  status: yup.boolean().required(),
  deletedAt: yup.string().nullable().default(null),
  dateScheduled: yup.string().nullable().default(null),
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

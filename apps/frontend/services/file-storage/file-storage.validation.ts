import * as yup from 'yup';
import { VISIBILITY_ENUM } from '@rl/types';

const validVisibilityValues = Object.values(VISIBILITY_ENUM);

// --- INPUT SCHEMAS ---
export const getUploadUrlInputSchema = yup.object({
  fileName: yup.string().required('File name is required'),
  storageType: yup
    .string()
    .oneOf(validVisibilityValues, 'Invalid storage type')
    .required('Storage type is required'),
});

export const fileKeyInputSchema = yup.object({
  fileKey: yup.string().required('File key is required'),
});

// --- RESPONSE SCHEMAS ---
export const fileStorageMetaSchema = yup.object({
  Name: yup.string().required(),
  Bucket: yup.string().required(),
  Key: yup.string().required(),
});

export const uploadUrlResponseSchema = yup.object({
  signedUrl: yup.string().url().required(),
  metaInfo: fileStorageMetaSchema.required(),
  viewSrc: yup.string().url().nullable().defined(),
});

export const uploadUrlBackendResponseSchema = yup.object({
  message: yup.string().optional(),
  statusCode: yup.number().optional(),
  fileStorage: uploadUrlResponseSchema.required(),
});

// GET /view-url response schema
export const viewUrlBackendResponseSchema = yup.object({
  message: yup.string().optional(),
  statusCode: yup.number().optional(),
  fileStorage: yup
    .object({
      signedUrl: yup
        .string()
        .url('Backend returned an invalid URL')
        .required('signedUrl is required'),
    })
    .required('fileStorage object is missing'),
});

// DELETE / response schema
export const deleteBackendResponseSchema = yup.object({
  message: yup.string().optional(),
  statusCode: yup.number().optional(),
});

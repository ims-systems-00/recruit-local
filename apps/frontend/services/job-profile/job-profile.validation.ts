import * as yup from 'yup';
import { PROFICIENCY, VISIBILITY } from '@rl/types';

import {
  objectIdSchema,
  deleteMarkerSchema,
  paginationSchema,
} from '@/services/shared';

// --- SUB-SCHEMAS ---
export const languageSchema = yup.object({
  _id: objectIdSchema.optional(),
  name: yup.string().required('Language name is required'),
  proficiencyLevel: yup
    .mixed<PROFICIENCY>()
    .oneOf(Object.values(PROFICIENCY))
    .required('Proficiency level is required'),
  createdAt: yup.string().optional(),
  updatedAt: yup.string().optional(),
});

export const awsStorageSchema = yup.object({
  Name: yup.string().required('Name is required'),
  Bucket: yup.string().required('Bucket is required'),
  Key: yup.string().required('Key is required'),
});

// --- CORE DATA MODEL ---
export const jobProfileSchema = yup.object({
  _id: objectIdSchema.required(),
  userId: objectIdSchema.required(),
  headline: yup.string().nullable().optional(),
  summary: yup.string().nullable().optional(),
  keywords: yup.array().of(yup.string().required()).nullable().optional(),
  languages: yup.array().of(languageSchema).nullable().optional(),
  visibility: yup
    .mixed<VISIBILITY>()
    .oneOf(Object.values(VISIBILITY))
    .optional(),
  statusId: objectIdSchema.nullable().optional(),
  kycDocumentId: objectIdSchema.nullable().optional(),
  status: yup.string().nullable().optional(),
  deleteMarker: deleteMarkerSchema.required(),
  createdAt: yup.string().required(),
  updatedAt: yup.string().required(),
  __v: yup.number().optional(),
});

// --- INPUT SCHEMAS (Matches Backend Joi) ---
export const idParamsSchema = yup.object({
  id: objectIdSchema.required('ID is required'),
});

export const createJobProfileSchema = yup.object({
  headline: yup.string().optional(),
  summary: yup.string().optional(),
  keywords: yup.array().of(yup.string().required()).optional(),
  languages: yup.array().of(languageSchema).optional(),
  kycDocumentStorage: awsStorageSchema.optional(),
});

export const updateJobProfileSchema = yup.object({
  headline: yup.string().optional(),
  summary: yup.string().optional(),
  keywords: yup.array().of(yup.string().required()).optional(),
  languages: yup.array().of(languageSchema).optional(),
  visibility: yup
    .mixed<VISIBILITY>()
    .oneOf(Object.values(VISIBILITY))
    .optional(),
  statusId: objectIdSchema.optional(),
  kycDocumentStorage: awsStorageSchema.optional(),
});

// --- BACKEND RESPONSE ENVELOPES ---
export const jobProfileListResponseSchema = yup.object({
  jobProfiles: yup.array().of(jobProfileSchema).required(),
  pagination: paginationSchema.required(),
  message: yup.string().optional(),
});

export const jobProfileItemResponseSchema = yup.object({
  jobProfile: jobProfileSchema.required(),
  message: yup.string().optional(),
});

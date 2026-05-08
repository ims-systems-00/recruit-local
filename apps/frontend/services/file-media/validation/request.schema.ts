import * as yup from 'yup';
import {
  objectIdSchema,
  storageInformationSchema,
  validModelNames,
  validVisibilities,
} from '@/services/shared';

// GET/PUT/DELETE /:id
export const idParamsSchema = yup.object({
  id: objectIdSchema.required('ID is required'),
});

// POST /file-medias
export const createBodySchema = yup.object({
  collectionName: yup
    .string()
    .oneOf(validModelNames, 'Invalid collection name')
    .required('Collection name is required'),

  collectionDocument: objectIdSchema.required(
    'Collection document ID is required',
  ),

  storageInformation: storageInformationSchema.required(
    'Storage information is required',
  ),

  visibility: yup
    .string()
    .oneOf(validVisibilities, 'Invalid visibility status')
    .required('Visibility is required'),
});

// PUT /file-medias/:id
export const updateBodySchema = yup.object({
  collectionName: yup.string().oneOf(validModelNames).optional(),
  collectionDocument: objectIdSchema.optional(),
  storageInformation: storageInformationSchema.clone().optional(),
  visibility: yup.string().oneOf(validVisibilities).optional(),
});

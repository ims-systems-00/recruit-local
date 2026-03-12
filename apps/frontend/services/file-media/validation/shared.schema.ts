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

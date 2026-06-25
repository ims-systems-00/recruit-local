import * as yup from 'yup';
import { paginationSchema } from '../shared';

export const experienceLevelSchema = yup.object({
  _id: yup.string().required('ID is required'),
  name: yup.string().required('Name is required'),
  description: yup.string().optional(),
  isActive: yup.boolean().optional(),
});

export const experienceLevelListResponseSchema = yup.object({
  experienceLevels: yup.array().of(experienceLevelSchema).required(),
  pagination: paginationSchema.required(),
  message: yup.string().optional(),
});

export const MAX_EXPERIENCE_LEVELS_STEP_SELECTION = 3;

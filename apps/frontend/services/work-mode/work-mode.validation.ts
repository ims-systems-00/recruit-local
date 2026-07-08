import * as yup from 'yup';
import { paginationSchema } from '../shared';

export const workModeSchema = yup.object({
  _id: yup.string().required('ID is required'),
  name: yup.string().required('Name is required'),
  description: yup.string().optional(),
  isActive: yup.boolean().optional(),
});

export const workModeListResponseSchema = yup.object({
  workModes: yup.array().of(workModeSchema).required(),
  pagination: paginationSchema.required(),
  message: yup.string().optional(),
});

export const MAX_WORK_MODES_STEP_SELECTION = 3;

import * as yup from 'yup';
import { paginationSchema } from '../shared';

export const industrySchema = yup.object({
  _id: yup.string().required('ID is required'),
  name: yup.string().required('Name is required'),
  isActive: yup.boolean().optional(),
});

export const industryListResponseSchema = yup.object({
  industries: yup.array().of(industrySchema).required(),
  pagination: paginationSchema.required(),
  message: yup.string().optional(),
});

export const MAX_INDUSTRIES_STEP_SELECTION = 3;

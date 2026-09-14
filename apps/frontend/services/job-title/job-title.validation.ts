import * as yup from 'yup';
import { cursorPaginationSchema } from '../shared';

export const jobTitleSchema = yup.object({
  _id: yup.string().required('ID is required'),
  name: yup.string().required('Name is required'),
  isActive: yup.boolean().optional(),
});

export const jobTitleListResponseSchema = yup.object({
  jobTitles: yup.array().of(jobTitleSchema).required(),
  pagination: cursorPaginationSchema.required(),
  message: yup.string().optional(),
});

export const MAX_JOB_TITLES_STEP_SELECTION = 3;

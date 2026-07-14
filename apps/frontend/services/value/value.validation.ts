import * as yup from 'yup';
import { paginationSchema } from '../shared';
import { VALUE_TYPE_ENUM } from '@rl/types';

export const valueSchema = yup.object({
  _id: yup.string().required('ID is required'),
  type: yup
    .string()
    .oneOf(Object.values(VALUE_TYPE_ENUM))
    .required('Type is required'),
  label: yup.string().required('Label is required'),
  isActive: yup.boolean().optional(),
  weight: yup.number().min(0).optional(),
});

export const valueListResponseSchema = yup.object({
  values: yup.array().of(valueSchema).required(),
  pagination: paginationSchema.required(),
  message: yup.string().optional(),
});

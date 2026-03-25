import * as yup from 'yup';
import { objectIdSchema, paginationSchema } from '../shared';

export const formSchema = yup.object({
  _id: objectIdSchema.required(),
  collectionName: yup.string().required(),
  collectionId: objectIdSchema.required(),
  title: yup.string().required(),
  description: yup.string().nullable().optional(),
  theme: yup.string().nullable().optional(),
  createdBy: objectIdSchema.optional(),
  submissionCount: yup.number().optional(),
  collaboration: yup.array().of(objectIdSchema).optional(),
  createdAt: yup.string().optional(),
  updatedAt: yup.string().optional(),
});

export const idParamsSchema = yup.object({
  id: objectIdSchema.required('Form ID is required'),
});

export const createFormSchema = yup.object({
  collectionName: yup.string().required('Collection Name is required'),
  collectionId: objectIdSchema.required('Collection ID is required'),
  title: yup
    .string()
    .max(50, 'Title cannot exceed 50 characters')
    .required('Title is required'),
  description: yup
    .string()
    .max(255, 'Description cannot exceed 255 characters')
    .nullable()
    .optional(),
  theme: yup.string().max(50).nullable().optional(),
  collaboration: yup.array().of(objectIdSchema).optional(),
});

export const updateFormSchema = yup.object({
  collectionName: yup.string().optional(),
  collectionId: objectIdSchema.optional(),
  title: yup.string().max(50).optional(),
  description: yup.string().max(255).nullable().optional(),
  theme: yup.string().max(50).nullable().optional(),
  collaboration: yup.array().of(objectIdSchema).optional(),
});

export const formListResponseSchema = yup.object({
  message: yup.string().required(),
  statusCode: yup.number().required(),
  forms: yup.array().of(formSchema).required(),
  pagination: paginationSchema.required(),
});

export const formItemResponseSchema = yup.object({
  form: formSchema.required(),
  message: yup.string().optional(),
  statusCode: yup.number().optional(),
});

export const formActionResponseSchema = yup.object({
  message: yup.string().optional(),
  statusCode: yup.number().optional(),
});

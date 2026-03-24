import * as yup from 'yup';
import { paginationSchema } from '../shared';

// Yup schemas for validation
export const statusCreateSchema = yup.object({
  collectionName: yup.string().required('Collection Name is required'),
  collectionId: yup.string().optional().nullable(),
  label: yup.string().required('Label is required'),
  weight: yup.number().integer().min(0).default(0),
  default: yup.boolean().default(false),
  backgroundColor: yup
    .string()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Must be a valid hex color')
    .default('#FFFFFF'),
});

export const statusUpdateSchema = yup.object({
  collectionName: yup.string().optional(),
  collectionId: yup.string().optional().nullable(),
  label: yup.string().optional(),
  weight: yup.number().integer().min(0).optional(),
  default: yup.boolean().optional(),
  backgroundColor: yup
    .string()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Must be a valid hex color')
    .optional(),
});

export const statusIdParamsSchema = yup.object({
  id: yup.string().required('ID is required'),
});

export const deleteMarkerSchema = yup.object({
  status: yup.boolean().required(),
  deletedAt: yup.string().nullable().optional(),
  dateScheduled: yup.string().nullable().optional(),
});

export const statusSchema = yup.object({
  _id: yup.string().required('ID is required'),
  collectionName: yup.string().required('Collection Name is required'),
  collectionId: yup.string().optional().nullable(),
  label: yup.string().required('Label is required'),
  weight: yup.number().integer().required(),
  default: yup.boolean().required(),
  backgroundColor: yup.string().required(),
  deleteMarker: deleteMarkerSchema.optional(),
  createdAt: yup.string().optional(),
  updatedAt: yup.string().optional(),
  deletedAt: yup.string().nullable().optional(),
});

export const statusListResponseSchema = yup.object({
  statuses: yup.array().of(statusSchema).required(),
  pagination: paginationSchema.required(),
  message: yup.string().optional(),
});

export const statusItemResponseSchema = yup.object({
  status: statusSchema.required(),
  message: yup.string().optional(),
});

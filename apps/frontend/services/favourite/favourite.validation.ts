import * as yup from 'yup';
import { paginationSchema } from '../shared';

export const favouriteCreateSchema = yup.object({
  itemId: yup.string().required('Item ID is required'),
  itemType: yup.string().required('Item Type is required'),
});

export const favouriteUpdateSchema = yup.object({
  itemType: yup.string().optional(),
});

export const favouriteIdParamsSchema = yup.object({
  id: yup.string().required('ID is required'),
});

export const deleteMarkerSchema = yup.object({
  status: yup.boolean().required(),
  deletedAt: yup.string().nullable().optional(),
  dateScheduled: yup.string().nullable().optional(),
});

export const favouriteSchema = yup.object({
  _id: yup.string().required('ID is required'),
  tenantId: yup.string().required('Tenant ID is required'),
  jobProfileId: yup.string().required('Job Profile ID is required'),
  itemId: yup.string().required('Item ID is required'),
  itemType: yup.string().required('Item Type is required'),
  deleteMarker: deleteMarkerSchema.optional(),
  createdAt: yup.string().optional(),
  updatedAt: yup.string().optional(),
  deletedAt: yup.string().nullable().optional(),
});

export const favouriteListResponseSchema = yup.object({
  favourites: yup.array().of(favouriteSchema).required(),
  pagination: paginationSchema.optional(),
  message: yup.string().optional(),
});

export const favouriteItemResponseSchema = yup.object({
  favourite: favouriteSchema.required(),
  message: yup.string().optional(),
});

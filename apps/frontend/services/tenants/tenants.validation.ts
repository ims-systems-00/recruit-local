import * as yup from 'yup';

export const deleteMarkerSchema = yup.object({
  status: yup.boolean().required(),
  deletedAt: yup.string().nullable().optional(),
  dateScheduled: yup.string().nullable().optional(),
});

export const tenantsSchema = yup.object({
  _id: yup.string().required('ID is required'),
  name: yup.string().required('Name is required'),
  status: yup.string().required('Status is required'),
  deleteMarker: deleteMarkerSchema.optional(),
  createdAt: yup.string().optional(),
  updatedAt: yup.string().optional(),
  deletedAt: yup.string().nullable().optional(),
});

export const tenantsIdParamsSchema = yup.object({
  id: yup.string().required('ID is required'),
});

export const tenantsItemResponseSchema = yup.object({
  tenant: tenantsSchema.required(),
  message: yup.string().optional(),
});

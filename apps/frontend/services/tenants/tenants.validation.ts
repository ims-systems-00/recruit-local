import * as yup from 'yup';
import { TENANT_STATUS_ENUMS, TENANT_TYPE } from '@rl/types';
import { isValidPhoneNumber } from 'libphonenumber-js';

export const awsStorageSchema = yup.object({
  Name: yup.string().required('Name is required'),
  Bucket: yup.string().required('Bucket is required'),
  Key: yup.string().required('Key is required'),
});

export const deleteMarkerSchema = yup.object({
  status: yup.boolean().required(),
  deletedAt: yup.string().nullable().optional(),
  dateScheduled: yup.string().nullable().optional(),
});

export const tenantsSchema = yup.object({
  _id: yup.string().required('ID is required'),
  name: yup.string().required('Name is required'),
  status: yup.string().required('Status is required'),

  description: yup.string().optional(),
  email: yup.string().email().optional(),
  industry: yup.string().optional(),
  officeAddress: yup.string().optional(),
  phone: yup.string().optional(),
  size: yup.number().optional(),
  type: yup.string().optional(),
  website: yup.string().optional(),
  linkedIn: yup.string().optional(),
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

export const tenantUpdateSchema = yup.object({
  name: yup
    .string()
    .trim()
    .max(300, 'Name must be at most 300 characters')
    .required('Name is required'),

  description: yup.string().optional(),

  industry: yup
    .string()
    .max(50, 'Industry must be at most 50 characters')
    .optional(),

  type: yup.string().oneOf(Object.values(TENANT_TYPE)).optional(),

  size: yup
    .number()
    .typeError('Number of Employers must be a number')
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .optional(),

  phone: yup
    .string()
    .optional()
    .test(
      'is-valid-phone',
      'Invalid phone number',
      (value) => !value || isValidPhoneNumber(value),
    ),

  email: yup.string().email('Invalid email format').optional(),

  logoSquareSrc: yup.string().url('Invalid URL').optional(),

  logoSquareStorage: awsStorageSchema
    .optional()
    .transform((value) => {
      // If value is empty object or undefined, return undefined
      if (
        !value ||
        (typeof value === 'object' && Object.keys(value).length === 0)
      ) {
        return undefined;
      }
      return value;
    })
    .default(undefined),

  logoRectangleSrc: yup.string().url('Invalid URL').optional(),

  logoRectangleStorage: awsStorageSchema
    .optional()
    .transform((value) => {
      // If value is empty object or undefined, return undefined
      if (
        !value ||
        (typeof value === 'object' && Object.keys(value).length === 0)
      ) {
        return undefined;
      }
      return value;
    })
    .default(undefined),

  officeAddress: yup.string().optional(),

  addressInMap: yup.string().optional(),

  status: yup.string().oneOf(Object.values(TENANT_STATUS_ENUMS)).optional(),

  website: yup.string().url('Invalid URL').optional(),

  linkedIn: yup.string().url('Invalid URL').optional(),

  missionStatement: yup.string().optional(),

  visionStatement: yup.string().optional(),

  coreProducts: yup.string().optional(),

  coreServices: yup.string().optional(),
});

export type TenantUpdateInput = yup.InferType<typeof tenantUpdateSchema>;

import * as yup from 'yup';
import {
  WORKING_DAYS_ENUMS,
  REQUIRED_DOCUMENTS_ENUMS,
  QUERY_TYPE_ENUMS,
} from '@rl/types';
import { isValidPhoneNumber } from 'libphonenumber-js';

// AWS Storage
export const awsStorageSchema = yup.object({
  Name: yup.string().required('Name is required'),
  Bucket: yup.string().required('Bucket is required'),
  Key: yup.string().required('Key is required'),
});

// Working Hours
export const workingHoursSchema = yup.object({
  startTime: yup
    .string()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
    .optional(),

  endTime: yup
    .string()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
    .optional(),
});

export const jobInformationSchema = yup.object({
  title: yup.string().trim().required('Job title is required'),

  employmentType: yup.string().optional(),

  workplace: yup.string().optional(),

  yearOfExperience: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .typeError('Year of experience must be a number')
    .optional(),

  vacancy: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .typeError('Vacancy must be a number')
    .optional(),

  salary: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .typeError('Salary must be a number')
    .optional(),

  period: yup.string().optional(),

  workingDays: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .typeError('Working days must be a number')
    .optional(),

  weekends: yup
    .array()
    .of(yup.string().oneOf(Object.values(WORKING_DAYS_ENUMS)))
    .optional(),

  aboutUs: yup.string().optional(),

  email: yup.string().email('Invalid email').optional(),

  workingHours: workingHoursSchema.optional(),
  endDate: yup.date().optional(),

  number: yup
    .string()
    .optional()
    .test(
      'is-valid-phone',
      'Invalid phone number',
      (value) => !value || isValidPhoneNumber(value),
    ),

  location: yup.string().optional(),

  locationAdditionalInfo: yup.string().optional(),

  autoFill: yup.boolean().default(false),
});

export type JobInformationFormValues = yup.InferType<
  typeof jobInformationSchema
>;

export const jobDescriptionSchema = yup.object({
  description: yup.string().optional(),
  responsibility: yup.string().optional(),
  attachmentsStorage: yup.array().of(awsStorageSchema).optional(),

  requiredDocuments: yup
    .array()
    .of(yup.string().oneOf(Object.values(REQUIRED_DOCUMENTS_ENUMS)))
    .optional(),
});

export type JobDescriptionFormValues = yup.InferType<
  typeof jobDescriptionSchema
>;

export const additionalQuerySchema = yup.object({
  question: yup.string().required('Question is required'),

  type: yup
    .string()
    .oneOf(Object.values(QUERY_TYPE_ENUMS), 'Invalid Query Type')
    .required('Query Type is required'),

  options: yup
    .array()
    .of(yup.string())
    .when('type', {
      is: (type: QUERY_TYPE_ENUMS) =>
        [
          QUERY_TYPE_ENUMS.SINGLE_CHOICE,
          QUERY_TYPE_ENUMS.MULTIPLE_CHOICE,
        ].includes(type),
      then: (schema) =>
        schema
          .min(1, 'At least one option is required')
          .required('Options are required'),
      otherwise: (schema) => schema.strip(),
    }),

  isRequired: yup.boolean().default(false),

  expectedAnswer: yup
    .string()
    .optional()
    .nullable()
    .transform((value) => value || ''),
});

export const jobAdditionalQuerySchema = yup.object({
  additionalQueries: yup.array().of(additionalQuerySchema).default([]),
});

export type jobAdditionalQueryFormValues = yup.InferType<
  typeof jobAdditionalQuerySchema
>;

export const jobPreviewSchema = yup.object({
  status: yup.string().optional(),
});

export type JobPreviewFormValues = yup.InferType<typeof jobPreviewSchema>;

export const fullJobSchema = jobInformationSchema
  .concat(jobDescriptionSchema)
  .concat(jobAdditionalQuerySchema)
  .concat(jobPreviewSchema);

export type MultiStepJobFormValues = yup.InferType<typeof fullJobSchema>;

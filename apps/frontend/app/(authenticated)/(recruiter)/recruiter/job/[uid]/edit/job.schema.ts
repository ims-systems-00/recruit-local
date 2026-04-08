import * as yup from 'yup';
import {
  WORKPLACE_ENUMS,
  WORKING_DAYS_ENUMS,
  EMPLOYMENT_TYPE,
  PERIOD_ENUMS,
  REQUIRED_DOCUMENTS_ENUMS,
} from '@rl/types';
import { isValidPhoneNumber } from 'react-phone-number-input';

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

// Salary
export const salarySchema = yup.object({
  // salary mode is missing in core constant
  mode: yup.string().optional(),
  amount: yup
    .number()
    .typeError('Salary must be a number')
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .optional(),
  min: yup
    .number()
    .typeError('Min. Salary must be a number')
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .optional(),
  max: yup
    .number()
    .typeError('Max. Salary must be a number')
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .optional(),
});

// Education
export const educationSchema = yup.object({
  degree: yup.string().nullable(),
  fieldOfStudy: yup.string().nullable(),
  gpa: yup.string().nullable(),
});

// Skill
export const skillSchema = yup.object({
  name: yup.string().required('Skill name is required'),
  years: yup.number().nullable(),
});

export const stepOneJobSchema = yup.object({
  // Basic Information
  title: yup.string().required('Title is required'),
  employmentType: yup.string().oneOf(Object.values(EMPLOYMENT_TYPE)).nullable(),
  workingHours: workingHoursSchema.nullable(),
  vacancy: yup
    .number()
    .typeError('Vacancy must be a number')
    .min(1, 'Vacancy must be at least 1')
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .optional(),
  location: yup.string().nullable(),
  workplace: yup.string().oneOf(Object.values(WORKPLACE_ENUMS)).nullable(),
  workingDays: yup
    .array()
    .of(yup.string().oneOf(Object.values(WORKING_DAYS_ENUMS)))
    .nullable(),

  weekends: yup
    .array()
    .of(yup.string().oneOf(Object.values(WORKING_DAYS_ENUMS)))
    .nullable(),

  // Job Description
  salary: salarySchema.nullable(),
  period: yup.string().oneOf(Object.values(PERIOD_ENUMS)).nullable(),

  email: yup.string().email('Invalid email').default(undefined),
  number: yup
    .string()
    .optional()
    .test(
      'is-valid-phone',
      'Invalid phone number',
      (value) => !value || isValidPhoneNumber(value),
    ),
  aboutUs: yup.string().nullable().default(undefined),
  autoFill: yup.boolean().nullable(),
  endDate: yup.date().nullable(),
});

export const stepTwoJobSchema = yup.object({
  description: yup.string().nullable(),
  responsibility: yup.string().nullable().default(undefined),
  attachmentsStorage: yup.array().of(awsStorageSchema).nullable(),

  //   Application Process
  requiredDocuments: yup
    .array()
    .of(yup.string().oneOf(Object.values(REQUIRED_DOCUMENTS_ENUMS)))
    .nullable(),
});

export const stepThreeJobSchema = yup.object({
  // category does not exists on ui
  category: yup.string().nullable(),

  // keywords does not exists on ui
  keywords: yup.array().of(yup.string()).nullable(),
});

export const fullJobSchema = stepOneJobSchema
  .concat(stepTwoJobSchema)
  .concat(stepThreeJobSchema);

export type MultiStepJobFormValues = yup.InferType<typeof fullJobSchema>;

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

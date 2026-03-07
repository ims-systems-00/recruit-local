import * as yup from 'yup';
import {
  WORKPLACE_ENUMS,
  WORKING_DAYS_ENUMS,
  EMPLOYMENT_TYPE,
  PERIOD_ENUMS,
  REQUIRED_DOCUMENTS_ENUMS,
} from '@rl/types';

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
    .nullable(),

  endTime: yup
    .string()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
    .nullable(),
});

// Salary
export const salarySchema = yup.object({
  // salary mode is missing in core constant
  mode: yup.string().required('Salary mode is required'),
  amount: yup.number().nullable(),
  min: yup.number().nullable(),
  max: yup.number().nullable(),
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
  bannerStorage: awsStorageSchema.nullable().default(undefined),
  // Basic Information
  title: yup.string().required('Title is required'),
  employmentType: yup.string().oneOf(Object.values(EMPLOYMENT_TYPE)).nullable(),
  workingHours: workingHoursSchema.nullable(),
  vacancy: yup
    .number()
    .typeError('Vacancy must be a number')
    .min(1, 'Vacancy must be at least 1')
    .nullable(),
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
  salary: salarySchema.nullable().default(undefined),
  period: yup.string().oneOf(Object.values(PERIOD_ENUMS)).nullable(),
  description: yup.string().nullable(),
  responsibility: yup.string().nullable(),
  attachmentsStorage: yup.array().of(awsStorageSchema).nullable(),
});

export const stepTwoJobSchema = yup.object({
  // Candidate Requirements
  minEducationalQualification: educationSchema.nullable(),

  //   skill need array but ui have text area
  skills: yup.array().of(skillSchema).nullable(),
  //   Experience Level Missing

  //   Application Process
  email: yup.string().email('Invalid email'),
  requiredDocuments: yup
    .array()
    .of(yup.string().oneOf(Object.values(REQUIRED_DOCUMENTS_ENUMS)))
    .nullable(),

  // why we should need start date
  startDate: yup.date().nullable(),

  endDate: yup
    .date()
    .min(yup.ref('startDate'), 'End date must be after start date')
    .nullable(),
});

export const stepThreeJobSchema = yup.object({
  number: yup.string().nullable(),
  aboutUs: yup.string().nullable(),
  autoFill: yup.boolean().nullable(),

  // category does not exists on ui
  category: yup.string().nullable(),

  // keywords does not exists on ui
  keywords: yup.array().of(yup.string()).nullable(),
});

export const fullJobSchema = stepOneJobSchema
  .concat(stepTwoJobSchema)
  .concat(stepThreeJobSchema);

export type MultiStepJobFormValues = yup.InferType<typeof fullJobSchema>;

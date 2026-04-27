import * as yup from 'yup';

import { objectIdSchema, paginationSchema } from '@/services/shared';
import { JobData } from '../jobs/job.type';
import { REQUIRED_DOCUMENTS_ENUMS } from '@rl/types';

export const awsStorageSchema = yup.object({
  Name: yup.string().required('Name is required'),
  Bucket: yup.string().required('Bucket is required'),
  Key: yup.string().required('Key is required'),
});

// --- CORE DATA MODEL ---
export const applicationSchema = yup.object({
  _id: objectIdSchema.required(),
  jobId: objectIdSchema.required(),
  jobProfileId: objectIdSchema.required(),
  coverLetter: yup.string().nullable().optional(),
  resumeStorage: awsStorageSchema.nullable().notRequired().default(undefined),
  caseStudyStorage: yup.array().of(awsStorageSchema).nullable().optional(),
  answers: yup
    .array()
    .of(
      yup.object({
        queryId: objectIdSchema.required('Query ID is required'),
        answer: yup.mixed().required('Answer is required'),
      }),
    )
    .nullable()
    .optional(),
  portfolioUrl: yup.string().url().nullable().optional(),
  jobProfile: yup.object({
    _id: objectIdSchema.required(),
    email: yup.string().required('Email is required'),
    name: yup.string().required('Name is required'),
  }),
  currentSalary: yup.number().nullable().optional(),
  expectedSalary: yup.number().nullable().optional(),
  feedback: yup.string().nullable().optional(),
  appliedAt: yup.string().nullable().optional(),
  status: yup.object({
    _id: objectIdSchema.required(),
    label: yup.string().required('Status label is required'),
  }),
  rank: yup.number().nullable().optional(),
});

// --- INPUT SCHEMAS (Matches Backend Joi) ---
export const idParamsSchema = yup.object({
  id: objectIdSchema.required('ID is required'),
});

export const createApplicationSchema = yup.object({
  jobId: yup.string().required('Job ID is required'),
  jobProfileId: yup.string().required('Job Profile ID is required'),
  coverLetter: yup.string().optional(),
  resumeStorage: awsStorageSchema.nullable().notRequired().default(undefined),
  caseStudyStorage: yup.array().of(awsStorageSchema).optional(),
  answers: yup
    .array()
    .of(
      yup.object({
        queryId: objectIdSchema.required('Query ID is required'),
        answer: yup.mixed().required('Answer is required'),
      }),
    )
    .optional(),
  portfolioUrl: yup.string().url().optional(),
  currentSalary: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .typeError('Current Salary must be a number')
    .optional(),
  expectedSalary: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .typeError('Expected Salary must be a number')
    .optional(),
  feedback: yup.string().optional(),
  appliedAt: yup.string().optional(),
});

export const updateApplicationSchema = yup.object({
  statusId: yup.string().required('Status is required'),
  coverLetter: yup.string().optional(),
  resumeStorage: awsStorageSchema.nullable().notRequired().default(undefined),
  caseStudyStorage: yup.array().of(awsStorageSchema).optional(),
  answers: yup
    .array()
    .of(
      yup.object({
        queryId: objectIdSchema.required('Query ID is required'),
        answer: yup.mixed().required('Answer is required'),
      }),
    )
    .optional(),
  portfolioUrl: yup.string().url().optional(),
  currentSalary: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .typeError('Current Salary must be a number')
    .optional(),
  expectedSalary: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === '' ? undefined : value,
    )
    .typeError('Salary must be a number')
    .optional(),
  feedback: yup.string().optional(),
  appliedAt: yup.string().optional(),
});

export const moveApplicationToColumnSchema = yup.object({
  targetStatusId: yup.string().required('Target Status ID is required'),
  targetIndex: yup.number().required('Target Index is required'),
});

// --- BACKEND RESPONSE ENVELOPES ---
export const applicationListResponseSchema = yup.object({
  applications: yup.array().of(applicationSchema).required(),
  pagination: paginationSchema.required(),
  message: yup.string().optional(),
});

export const applicationItemResponseSchema = yup.object({
  application: applicationSchema.required(),
  message: yup.string().optional(),
});

export const buildApplicationSchema = (job: JobData) => {
  // const queries = job?.additionalQueries || [];

  return yup.object({
    jobId: yup.string().required('Job ID is required'),
    jobProfileId: yup.string().required('Job Profile ID is required'),

    // Cover Letter
    coverLetter: yup
      .string()
      .optional()
      .test(
        'cover-letter-required',
        'Cover letter is required',
        function (value) {
          const isRequired = job.requiredDocuments?.includes(
            REQUIRED_DOCUMENTS_ENUMS.COVER_LETTER,
          );
          if (!isRequired) return true;
          return !!value?.trim();
        },
      ),

    resumeStorage: awsStorageSchema
      .nullable()
      .notRequired()
      .test('resume-required', 'Resume is required', function (value) {
        const isRequired = job.requiredDocuments?.includes(
          REQUIRED_DOCUMENTS_ENUMS.RESUME,
        );
        if (!isRequired) return true;
        return !!value;
      }),

    caseStudyStorage: yup.array().of(awsStorageSchema).optional(),

    portfolioUrl: yup
      .string()
      .url('Invalid URL')
      .optional()
      .test('portfolio-required', 'Portfolio is required', function (value) {
        const isRequired = job.requiredDocuments?.includes(
          REQUIRED_DOCUMENTS_ENUMS.PORTFOLIO,
        );
        if (!isRequired) return true;
        return !!value?.trim();
      }),

    answers: yup
      .array()
      .of(
        yup.object({
          queryId: objectIdSchema.required('Query ID is required'),
          answer: yup.mixed().required('Answer is required'),
        }),
      )
      .optional(),

    currentSalary: yup
      .number()
      .transform((value, originalValue) =>
        originalValue === '' ? undefined : value,
      )
      .typeError('Current Salary must be a number')
      .optional(),

    expectedSalary: yup
      .number()
      .transform((value, originalValue) =>
        originalValue === '' ? undefined : value,
      )
      .typeError('Expected Salary must be a number')
      .optional(),

    feedback: yup.string().optional(),
    appliedAt: yup.string().optional(),
  });
};

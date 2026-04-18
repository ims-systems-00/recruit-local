import { EMPLOYMENT_TYPE, WORKPLACE_ENUMS } from '@rl/types';
import * as yup from 'yup';
import { paginationSchema } from '../shared';

// Yup schemas for validation
export const experienceCreateSchema = yup.object({
  jobProfileId: yup.string().required('Job Profile ID is required'),
  company: yup.string().required('Company is required'),
  jobTitle: yup.string().required('Job Title is required'),
  location: yup.string().optional(),
  workplace: yup.string().oneOf(Object.values(WORKPLACE_ENUMS)).optional(),
  employmentType: yup.string().oneOf(Object.values(EMPLOYMENT_TYPE)).optional(),
  startDate: yup.string().required('Start Date is required'),
  endDate: yup
    .string()
    .optional()
    .test(
      'is-after-start',
      'End date cannot be earlier than start date',
      function (value) {
        const { startDate } = this.parent;

        if (!value) return true;

        return new Date(value) >= new Date(startDate);
      },
    ),
  description: yup.string().optional(),
  isActive: yup.boolean().optional(),
});

export const experienceUpdateSchema = yup.object({
  company: yup.string().optional(),
  jobTitle: yup.string().optional(),
  location: yup.string().optional(),
  workplace: yup.string().oneOf(Object.values(WORKPLACE_ENUMS)).optional(),
  employmentType: yup.string().oneOf(Object.values(EMPLOYMENT_TYPE)).optional(),
  startDate: yup.string().optional(),
  endDate: yup
    .string()
    .optional()
    .test(
      'is-after-start',
      'End date cannot be earlier than start date',
      function (value) {
        const { startDate } = this.parent;

        if (!value) return true;

        return new Date(value) >= new Date(startDate);
      },
    ),
  description: yup.string().optional(),
  isActive: yup.boolean().optional(),
});

export const experienceIdParamsSchema = yup.object({
  id: yup.string().required('ID is required'),
});

export const experienceSchema = yup.object({
  _id: yup.string().required('ID is required'),
  jobProfileId: yup.string().required('Job Profile ID is required'),
  userId: yup.string().required('User ID is required'),
  company: yup.string().required('Company is required'),
  jobTitle: yup.string().required('Job Title is required'),
  location: yup.string().optional(),
  workplace: yup.string().oneOf(Object.values(WORKPLACE_ENUMS)).optional(),
  employmentType: yup.string().oneOf(Object.values(EMPLOYMENT_TYPE)).optional(),
  startDate: yup.string().optional(),
  endDate: yup.string().optional(),
  description: yup.string().optional(),
  isActive: yup.boolean().optional(),
  createdAt: yup.string().required(),
  updatedAt: yup.string().required(),
  deletedAt: yup.string().optional(),
});

export const experienceListResponseSchema = yup.object({
  experiences: yup.array().of(experienceSchema).required(),
  pagination: paginationSchema.required(),
  message: yup.string().optional(),
});

export const experienceItemResponseSchema = yup.object({
  experience: experienceSchema.required(),
  message: yup.string().optional(),
});

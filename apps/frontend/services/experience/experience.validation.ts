import { EMPLOYMENT_TYPE, WORKPLACE_ENUMS } from '@rl/types';
import * as yup from 'yup';

// Yup schemas for validation
export const experienceCreateSchema = yup.object({
  jobProfileId: yup.string().required('Job Profile ID is required'),
  company: yup.string().required('Company is required'),
  jobTitle: yup.string().required('Job Title is required'),
  location: yup.string().optional(),
  workplace: yup.string().oneOf(Object.values(WORKPLACE_ENUMS)).optional(),
  employmentType: yup.string().oneOf(Object.values(EMPLOYMENT_TYPE)).optional(),
  startDate: yup.string().optional(),
  endDate: yup.string().optional(),
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
  endDate: yup.string().optional(),
  description: yup.string().optional(),
  isActive: yup.boolean().optional(),
});

export const experienceIdParamsSchema = yup.object({
  id: yup.string().required('ID is required'),
});

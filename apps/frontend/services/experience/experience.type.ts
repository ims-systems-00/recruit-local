import * as yup from 'yup';
import { WORKPLACE_ENUMS, EMPLOYMENT_TYPE } from '@rl/types';

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

// TypeScript types
export type ExperienceCreateInput = yup.InferType<typeof experienceCreateSchema>;
export type ExperienceUpdateInput = yup.InferType<typeof experienceUpdateSchema>;
export type ExperienceIdParams = yup.InferType<typeof experienceIdParamsSchema>;

export type ExperienceListFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

// API Response types
export type ExperienceData = {
  _id: string;
  jobProfileId: string;
  userId: string;
  company: string;
  jobTitle: string;
  location?: string;
  workplace?: WORKPLACE_ENUMS;
  employmentType?: EMPLOYMENT_TYPE;
  startDate?: string;
  endDate?: string;
  description?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type Pagination = {
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage?: number | null;
  nextPage?: number | null;
};

export type ExperienceListBackendResponse = {
  success: boolean;
  experiences: ExperienceData[];
  pagination: Pagination;
  message?: string;
};

export type ExperienceItemBackendResponse = {
  success: boolean;
  experience: ExperienceData;
  message?: string;
};

export type ExperienceListResponse = {
  docs: ExperienceData[];
  pagination: Pagination;
};

export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ErrorResponse = {
  success: false;
  message: string;
};

export type ExperienceApiResponse<T> = SuccessResponse<T> | ErrorResponse;

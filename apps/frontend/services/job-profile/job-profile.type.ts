import * as yup from 'yup';
import type { Pagination, PaginatedResponse, ApiResponse } from '@/types/api';
import { PROFICIENCY, VISIBILITY } from '@rl/types';
import {
  createJobProfileSchema,
  updateJobProfileSchema,
  jobProfileSchema,
} from './job-profile.validation';

// --- INFERRED TYPES FROM SCHEMAS ---
export type JobProfileCreateInput = yup.InferType<
  typeof createJobProfileSchema
>;
export type JobProfileUpdateInput = yup.InferType<
  typeof updateJobProfileSchema
>;
export type JobProfile = yup.InferType<typeof jobProfileSchema>;

// --- QUERY FILTERS ---
export type JobProfileListFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

// --- FRONTEND RESPONSE TYPES ---
export type JobProfileListResponse = PaginatedResponse<JobProfile>;
export type JobProfileApiResponse<T> = ApiResponse<T>;

import * as yup from 'yup';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import {
  createApplicationSchema,
  updateApplicationSchema,
  applicationSchema,
  moveApplicationToColumnSchema,
} from './application.validation';

// --- INFERRED TYPES FROM SCHEMAS ---
export type ApplicationCreateInput = yup.InferType<
  typeof createApplicationSchema
>;
export type ApplicationUpdateInput = yup.InferType<
  typeof updateApplicationSchema
>;
export type Application = yup.InferType<typeof applicationSchema>;

export type MoveApplicationToColumnInput = yup.InferType<
  typeof moveApplicationToColumnSchema
>;

// --- QUERY FILTERS ---
export type ApplicationListFilters = {
  jobId?: string;
  page?: number;
  limit?: number;
  clientSearch?: string;
  statusId?: string;
};

// --- FRONTEND RESPONSE TYPES ---
export type ApplicationListResponse = PaginatedResponse<Application>;
export type ApplicationApiResponse<T> = ApiResponse<T>;

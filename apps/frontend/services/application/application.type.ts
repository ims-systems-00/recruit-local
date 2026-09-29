import * as yup from 'yup';
import type { JobOverviewRange as JobOverviewRangeValue } from '@rl/types';
import type { CursorPaginatedResponse, ApiResponse } from '@/types/api';
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
  cursor?: string;
  limit?: number;
  clientSearch?: string;
  statusId?: string;
};

// --- FRONTEND RESPONSE TYPES ---
export type ApplicationListResponse = CursorPaginatedResponse<Application>;
export type ApplicationApiResponse<T> = ApiResponse<T>;

// --- JOB OVERVIEW ---
export type {
  JobOverviewRange,
  JobOverviewDailyDto as JobOverviewDaily,
  JobOverviewStageDto as JobOverviewStage,
  JobOverviewMatchScoreDto as JobOverviewMatchScore,
  JobOverviewResponseDto as JobOverview,
} from '@rl/types';

export type JobOverviewFilters = {
  jobId: string;
  range: JobOverviewRangeValue;
  tz?: string;
};

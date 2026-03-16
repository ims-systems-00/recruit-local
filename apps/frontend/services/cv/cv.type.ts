import * as yup from 'yup';
import type { Pagination, PaginatedResponse, ApiResponse } from '@/types/api';
import {
    createCvSchema,
    updateCvSchema,
    cvSchema,
} from './cv.validation';

// --- INFERRED TYPES FROM SCHEMAS ---
export type CvCreateInput = yup.InferType<typeof createCvSchema>;
export type CvUpdateInput = yup.InferType<typeof updateCvSchema>;
export type Cv = yup.InferType<typeof cvSchema>;

// --- QUERY FILTERS ---
export type CvListFilters = {
    page?: number;
    limit?: number;
    search?: string;
};

// --- FRONTEND RESPONSE TYPES ---
export type CvListResponse = PaginatedResponse<Cv>;
export type CvApiResponse<T> = ApiResponse<T>;
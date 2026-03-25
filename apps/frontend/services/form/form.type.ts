import * as yup from 'yup';
import type { Pagination, PaginatedResponse, ApiResponse } from '@/types/api';
import {
  createFormSchema,
  updateFormSchema,
  formSchema,
} from './form.validation';

// --- INFERRED TYPES FROM SCHEMAS ---
export type FormCreateInput = yup.InferType<typeof createFormSchema>;
export type FormUpdateInput = yup.InferType<typeof updateFormSchema>;
export type Form = yup.InferType<typeof formSchema>;

// --- QUERY FILTERS ---
export type FormListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  collectionName?: string;
  collectionId?: string;
};

// --- FRONTEND RESPONSE TYPES ---
export type FormListResponse = PaginatedResponse<Form>;
export type FormApiResponse = ApiResponse<Form>;

import * as yup from 'yup';
import type { Pagination, PaginatedResponse, ApiResponse } from '@/types/api';
import {
  deleteMarkerSchema,
  storageInformationSchema,
  createBodySchema,
  updateBodySchema,
  idParamsSchema,
  fileMediaSchema,
} from './validation';

// --- INFERRED TYPES FROM SCHEMAS ---
export type StorageInformation = yup.InferType<typeof storageInformationSchema>;
export type DeleteMarker = yup.InferType<typeof deleteMarkerSchema>;

export type FileMediaCreateInput = yup.InferType<typeof createBodySchema>;
export type FileMediaUpdateInput = yup.InferType<typeof updateBodySchema>;
export type FileMediaIdParams = yup.InferType<typeof idParamsSchema>;
export type FileMedia = yup.InferType<typeof fileMediaSchema>;

// --- QUERY FILTERS ---
export type FileMediaListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  collectionName?: string;
  visibility?: 'public' | 'private';
};

// --- BACKEND RESPONSE TYPES (Raw data from your API) ---
export type FileMediaListBackendResponse = {
  message: string;
  statusCode: number;
  fileMedias: FileMedia[];
  pagination: Pagination;
};

export type FileMediaItemBackendResponse = {
  message: string;
  statusCode?: number;
  fileMedia: FileMedia;
};

// --- FRONTEND RESPONSE TYPES (Standardized for React Query/UI) ---
export type FileMediaListResponse = PaginatedResponse<FileMedia>;
export type FileMediaApiResponse<T> = ApiResponse<T>;

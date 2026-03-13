import * as yup from 'yup';
import type { ApiResponse } from '@/types/api';
import {
  uploadUrlResponseSchema,
  fileStorageMetaSchema,
} from './file-storage.validation';
import { VISIBILITY_ENUM } from '@rl/types';

// --- INFERRED TYPES FROM SCHEMAS ---
export type FileStorageMetaInfo = yup.InferType<typeof fileStorageMetaSchema>;
export type UploadUrlData = yup.InferType<typeof uploadUrlResponseSchema>;

// --- INPUT PARAMETERS ---
export type GetUploadUrlParams = {
  fileName: string;
  storageType: VISIBILITY_ENUM;
};

export type GetViewUrlParams = {
  fileKey: string;
};

export type DeleteFileParams = {
  fileKey: string;
};

// --- BACKEND RESPONSE TYPES ---
export type UploadUrlBackendResponse = {
  message: string;
  statusCode: number;
  fileStorage: UploadUrlData;
};

// --- FRONTEND RESPONSE TYPES ---
export type FileStorageApiResponse<T> = ApiResponse<T>;

import * as yup from 'yup';
import {
  interestCreateSchema,
  interestIdParamsSchema,
  interestUpdateSchema,
} from './interest.validation';
import { CursorPagination } from '@/types/api';

// TypeScript types
export type InterestCreateInput = yup.InferType<typeof interestCreateSchema>;
export type InterestUpdateInput = yup.InferType<typeof interestUpdateSchema>;
export type InterestIdParams = yup.InferType<typeof interestIdParamsSchema>;

export type InterestListFilters = {
  limit?: number;
  search?: string;
};

// API Response types
export type InterestData = {
  _id: string;
  jobProfileId: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type InterestListBackendResponse = {
  success: boolean;
  interests: InterestData[];
  pagination: CursorPagination;
  message?: string;
};

export type InterestItemBackendResponse = {
  success: boolean;
  interest: InterestData;
  message?: string;
};

export type InterestListResponse = {
  docs: InterestData[];
  pagination: CursorPagination;
};

import * as yup from 'yup';
import {
  statusCreateSchema,
  statusIdParamsSchema,
  statusUpdateSchema,
} from './status.validation';
import { Pagination } from '@/types/api';

// TypeScript types
export type StatusCreateInput = yup.InferType<typeof statusCreateSchema>;
export type StatusUpdateInput = yup.InferType<typeof statusUpdateSchema>;
export type StatusIdParams = yup.InferType<typeof statusIdParamsSchema>;

export type StatusListFilters = {
  page?: number;
  limit?: number;
  collectionName?: string;
  collectionId?: string;
  label?: string;
};

// API Response types
export type StatusData = {
  _id: string;
  collectionName: string;
  collectionId?: string | null;
  label: string;
  weight: number;
  default: boolean;
  backgroundColor: string;
  deleteMarker?: {
    status: boolean;
    deletedAt?: string | null;
    dateScheduled?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type StatusListBackendResponse = {
  success: boolean;
  statuses: StatusData[];
  pagination: Pagination;
  message?: string;
};

export type StatusItemBackendResponse = {
  success: boolean;
  status: StatusData;
  message?: string;
};

export type StatusListResponse = {
  docs: StatusData[];
  pagination: Pagination;
};

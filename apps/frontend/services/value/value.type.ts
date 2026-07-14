import { Pagination } from '@/types/api';
import { VALUE_TYPE_ENUM } from '@rl/types';

export type ValueListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  type?: { in: string[] };
};

export type ValueData = {
  _id: string;
  type: VALUE_TYPE_ENUM;
  label: string;
  isActive?: boolean;
  weight?: number;
  deleteMarker?: {
    status: boolean;
    deletedAt: string | null;
    dateScheduled: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type ValueListResponse = {
  values: ValueData[];
  pagination: Pagination;
};

export type ValueListBackendResponse = {
  success: boolean;
  values: ValueData[];
  pagination: Pagination;
  message?: string;
};

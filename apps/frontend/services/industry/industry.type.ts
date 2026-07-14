import { Pagination } from '@/types/api';

export type IndustryListFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

export type IndustryData = {
  _id: string;
  name: string;
  isActive?: boolean;
  deleteMarker?: {
    status: boolean;
    deletedAt: string | null;
    dateScheduled: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type IndustryListResponse = {
  industries: IndustryData[];
  pagination: Pagination;
};

export type IndustryListBackendResponse = {
  success: boolean;
  industries: IndustryData[];
  pagination: Pagination;
  message?: string;
};

import { Pagination } from '@/types/api';

export type JobTitleListFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

export type JobTitleData = {
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

export type JobTitleListResponse = {
  jobTitles: JobTitleData[];
  pagination: Pagination;
};

export type JobTitleListBackendResponse = {
  success: boolean;
  jobTitles: JobTitleData[];
  pagination: Pagination;
  message?: string;
};

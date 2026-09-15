import { CursorPagination } from '@/types/api';

export type JobTitleListFilters = {
  cursor?: string;
  limit?: number;
  clientSearch?: string;
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
  pagination: CursorPagination;
};

export type JobTitleListBackendResponse = {
  success: boolean;
  jobTitles: JobTitleData[];
  pagination: CursorPagination;
  message?: string;
};

import { CursorPagination } from '@/types/api';

export type IndustryListFilters = {
  cursor?: string;
  limit?: number;
  clientSearch?: string;
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
  pagination: CursorPagination;
};

export type IndustryListBackendResponse = {
  success: boolean;
  industries: IndustryData[];
  pagination: CursorPagination;
  message?: string;
};

import { Pagination } from '@/types/api';

export type WorkModeListFilters = {
  page?: number;
  limit?: number;
  clientSearch?: string;
};

export type WorkModeData = {
  _id: string;
  name: string;
  isActive?: boolean;
  description?: string;
  deleteMarker?: {
    status: boolean;
    deletedAt: string | null;
    dateScheduled: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type WorkModeListResponse = {
  workModes: WorkModeData[];
  pagination: Pagination;
};

export type WorkModeListBackendResponse = {
  success: boolean;
  workModes: WorkModeData[];
  pagination: Pagination;
  message?: string;
};

import { Pagination } from '@/types/api';

export type ExperienceLevelListFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

export type ExperienceLevelData = {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  deleteMarker?: {
    status: boolean;
    deletedAt: string | null;
    dateScheduled: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type ExperienceLevelListResponse = {
  experienceLevels: ExperienceLevelData[];
  pagination: Pagination;
};

export type ExperienceLevelListBackendResponse = {
  success: boolean;
  experienceLevels: ExperienceLevelData[];
  pagination: Pagination;
  message?: string;
};

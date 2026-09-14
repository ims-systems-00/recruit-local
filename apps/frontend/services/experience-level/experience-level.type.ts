import { CursorPagination } from '@/types/api';

export type ExperienceLevelListFilters = {
  cursor?: string;
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
  pagination: CursorPagination;
};

export type ExperienceLevelListBackendResponse = {
  success: boolean;
  experienceLevels: ExperienceLevelData[];
  pagination: CursorPagination;
  message?: string;
};

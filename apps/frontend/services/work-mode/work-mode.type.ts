import { CursorPagination } from '@/types/api';

export type WorkModeListFilters = {
  cursor?: string;
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
  pagination: CursorPagination;
};

export type WorkModeListBackendResponse = {
  success: boolean;
  workModes: WorkModeData[];
  pagination: CursorPagination;
  message?: string;
};

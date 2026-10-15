import { CursorPagination } from '@/types/api';

export type SkillCatalogListFilters = {
  cursor?: string;
  limit?: number;
  clientSearch?: string;
};

// One entry of the platform skill catalogue — what a job's skills are picked from.
export type SkillCatalogData = {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SkillCatalogListResponse = {
  skills: SkillCatalogData[];
  pagination: CursorPagination;
};

export type SkillCatalogListBackendResponse = {
  success: boolean;
  skills: SkillCatalogData[];
  pagination: CursorPagination;
  message?: string;
};

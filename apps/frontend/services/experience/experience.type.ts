import * as yup from 'yup';
import { WORKPLACE_ENUMS, EMPLOYMENT_TYPE } from '@rl/types';
import { experienceCreateSchema, experienceIdParamsSchema, experienceUpdateSchema } from './experience.validation';
import { Pagination } from '@/types/api';


// TypeScript types
export type ExperienceCreateInput = yup.InferType<typeof experienceCreateSchema>;
export type ExperienceUpdateInput = yup.InferType<typeof experienceUpdateSchema>;
export type ExperienceIdParams = yup.InferType<typeof experienceIdParamsSchema>;

export type ExperienceListFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

// API Response types
export type ExperienceData = {
  _id: string;
  jobProfileId: string;
  userId: string;
  company: string;
  jobTitle: string;
  location?: string;
  workplace?: WORKPLACE_ENUMS;
  employmentType?: EMPLOYMENT_TYPE;
  startDate?: string;
  endDate?: string;
  description?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type ExperienceListBackendResponse = {
  success: boolean;
  experiences: ExperienceData[];
  pagination: Pagination;
  message?: string;
};

export type ExperienceItemBackendResponse = {
  success: boolean;
  experience: ExperienceData;
  message?: string;
};

export type ExperienceListResponse = {
  docs: ExperienceData[];
  pagination: Pagination;
};



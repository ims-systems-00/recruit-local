import * as yup from 'yup';
import {
  educationCreateSchema,
  educationIdParamsSchema,
  educationUpdateSchema,
} from './education.validation';
import { CursorPagination } from '@/types/api';

// TypeScript types
export type EducationCreateInput = yup.InferType<typeof educationCreateSchema>;
export type EducationUpdateInput = yup.InferType<typeof educationUpdateSchema>;
export type EducationIdParams = yup.InferType<typeof educationIdParamsSchema>;

export type EducationListFilters = {
  cursor?: string;
  limit?: number;
  search?: string;
  jobProfileId?: string;
};

// API Response types
export type EducationData = {
  _id: string;
  jobProfileId: string;
  userId: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type EducationListBackendResponse = {
  success: boolean;
  educations: EducationData[];
  pagination: CursorPagination;
  message?: string;
};

export type EducationItemBackendResponse = {
  success: boolean;
  education: EducationData;
  message?: string;
};

export type EducationListResponse = {
  docs: EducationData[];
  pagination: CursorPagination;
};

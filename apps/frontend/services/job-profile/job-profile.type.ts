import * as yup from 'yup';
import type { Pagination, PaginatedResponse, ApiResponse } from '@/types/api';
import { PROFICIENCY, VISIBILITY } from '@rl/types';
import {
  createJobProfileSchema,
  updateJobProfileSchema,
  jobProfileSchema,
} from './job-profile.validation';
import { ValueData } from '../value/value.type';

export interface JobProfileData {
  _id: string;
  userId: string;

  name: string;
  email: string;
  address: string;
  status: string;
  visibility: 'public' | 'private';
  onboardingStep: string;
  experienceLevel: string;

  jobTitle: JobTitle[];
  industry: Industry[];
  workMode: WorkMode[];
  values: ValueData[];
  languages: Language[];

  keywords: string[];

  completion: Completion;

  createdAt: string;
  updatedAt: string;
}

export interface JobTitle {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface Industry {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface WorkMode {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface Language {
  _id: string;
  name: string;
  level: string;
}

export interface Completion {
  percentage: number;
  sections: CompletionSection[];
  missing: string[];
  computedAt: string;
}

export interface CompletionSection {
  key: string;
  label: string;
  weight: number;
  complete: boolean;
}

// --- INFERRED TYPES FROM SCHEMAS ---
export type JobProfileCreateInput = yup.InferType<
  typeof createJobProfileSchema
>;
export type JobProfileUpdateInput = yup.InferType<
  typeof updateJobProfileSchema
>;
export type JobProfile = yup.InferType<typeof jobProfileSchema>;

// --- QUERY FILTERS ---
export type JobProfileListFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

// --- FRONTEND RESPONSE TYPES ---
export type JobProfileListResponse = PaginatedResponse<JobProfile>;
export type JobProfileApiResponse<T> = ApiResponse<T>;

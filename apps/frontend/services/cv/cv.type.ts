import * as yup from 'yup';
import type { Pagination, PaginatedResponse, ApiResponse } from '@/types/api';
import {
  createCvSchema,
  updateCvSchema,
  cvSchema,
  extractAndCreateCvSchema,
} from './cv.validation';
import { JobTitle, WorkMode, Industry } from '../job-profile/job-profile.type';

// --- INFERRED TYPES FROM SCHEMAS ---
export type CvCreateInput = yup.InferType<typeof createCvSchema>;
export type CvUpdateInput = yup.InferType<typeof updateCvSchema>;
export type Cv = yup.InferType<typeof cvSchema>;
export type ExtractAndCreateCvInput = yup.InferType<
  typeof extractAndCreateCvSchema
>;

// --- QUERY FILTERS ---
export type CvListFilters = {
  page?: number;
  limit?: number;
  clientSearch?: string;
};

// --- FRONTEND RESPONSE TYPES ---
export type CvListResponse = PaginatedResponse<CvData>;
export type CvApiResponse<T> = ApiResponse<T>;

export interface Skill {
  name: string;
  proficiencyLevel: string;
}

export interface Experience {
  jobTitle: string;
  company: string;
  location: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade: string;
}

export interface Interest {
  name: string;
}

export interface ExperienceLevel {
  _id: string;
  name: string;
}

export interface ExtractedData {
  name: string;
  email: string;
  phone: string;
  address: string;
  summary: string;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  interests: Interest[];
}

export type CvExtractionData = {
  cv: Cv;
  extractedData: ExtractedData;
  jobTitles: JobTitle[];
  industries: Industry[];
  workModes: WorkMode[];
  experienceLevels: ExperienceLevel[];
};

export interface CvData {
  _id: string;
  title: string;
  imageId: string | null;
  status: string;
  resumeId: string;
  userId: string;
  jobProfileId: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  interests: Interest[];
  createdAt: string;
  updatedAt: string;
  resume: {
    _id: string;
    storageInformation: {
      Name: string;
      Key: string;
      Bucket: string;
    };
    visibility: string;
    src: string | null;
  };
}

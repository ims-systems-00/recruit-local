import * as yup from 'yup';
import type { CursorPaginatedResponse, ApiResponse } from '@/types/api';
import {
  createCvSchema,
  updateCvSchema,
  cvSchema,
  extractAndCreateCvSchema,
} from './cv.validation';
import { JobTitle, WorkMode, Industry } from '../job-profile/job-profile.type';
import type {
  IEducation,
  IExperience,
  ITraining,
  ProfileSkillResponseDto,
} from '@rl/types';

// --- INFERRED TYPES FROM SCHEMAS ---
export type CvCreateInput = yup.InferType<typeof createCvSchema>;
export type CvUpdateInput = yup.InferType<typeof updateCvSchema>;
export type Cv = yup.InferType<typeof cvSchema>;
export type ExtractAndCreateCvInput = yup.InferType<
  typeof extractAndCreateCvSchema
>;

// --- QUERY FILTERS ---
export type CvListFilters = {
  limit?: number;
  clientSearch?: string;
  jobProfileId?: string;
};

export type CvListCursorFilters = {
  cursor?: string;
  limit?: number;
  clientSearch?: string;
  jobProfileId?: string;
};

export type CvListRequestFilters = {
  cursor?: string;
  limit?: number;
  clientSearch?: string;
  jobProfileId?: string;
};

// --- FRONTEND RESPONSE TYPES ---
export type CvListResponse = CursorPaginatedResponse<CvData>;
export type CvListCursorResponse = CursorPaginatedResponse<CvData>;
export type CvApiResponse<T> = ApiResponse<T>;

/**
 * Short-lived signed links to a CV's resume file and its preview image.
 * `thumbnailUrl` is null until the preview has been generated.
 */
export type CvResumeUrls = {
  url: string;
  thumbnailUrl: string | null;
};

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

/** A catalogue entry as the import returns it. */
type CatalogueEntry = { _id: string; name: string };

/** A shared row type as JSON carries it: its dates are ISO strings. */
type WithIsoDates<T> = {
  [K in keyof T]: T[K] extends Date | undefined
    ? Exclude<T[K], Date> | string
    : T[K];
};

/**
 * A CV's work experience, education and training rows, by profile section,
 * as the import returns them and `POST /cvs/import-records` takes them back.
 */
export type CvRecords = {
  experience: WithIsoDates<IExperience>[];
  education: WithIsoDates<IEducation>[];
  training: WithIsoDates<ITraining>[];
};

/** A number per CV section: rows saved, or rows already on the profile. */
export type CvRecordCounts = Record<keyof CvRecords, number>;

/**
 * What "Import from CV" returns; the import itself saves nothing. `profile`
 * uses the profile form's own field names, for the edit form. `records` holds
 * only the rows the profile lacks, and `alreadyOnProfile` counts the ones it
 * already has.
 */
export type CvProfileImport = {
  profile: {
    name?: string;
    contactNumber?: string;
    address?: string;
    summary?: string;
    interests?: string;
    jobTitle: CatalogueEntry[];
    industry: CatalogueEntry[];
    workMode: CatalogueEntry[];
    experienceLevel: CatalogueEntry | null;
    skills: ProfileSkillResponseDto[];
  };
  records: CvRecords;
  alreadyOnProfile: CvRecordCounts;
};

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

import { Pagination } from '@/types/api';
import { DeleteMarker } from '../file-media/file-media.type';
import {
  EMPLOYMENT_TYPE,
  PERIOD_ENUMS,
  QUERY_TYPE_ENUMS,
  WORKING_DAYS_ENUMS,
  WORKPLACE_ENUMS,
} from '@rl/types';

export type JobListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type StorageInformation = {
  Name: string;
  Key: string;
  Bucket: string;
};

export type AdditionalQuery = {
  _id?: string;
  question: string;
  type: QUERY_TYPE_ENUMS;
  options?: string[];
  isRequired: boolean;
  expectedAnswer?: string;
};

export interface JobData {
  _id: string;
  title: string;
  description: string;
  email: string;
  number: string;
  aboutUs: string;
  reference: string;
  totalApplications: number;

  startDate: string; // ISO date string
  endDate: string; // ISO date string

  yearOfExperience: number;
  responsibility: string;

  attachmentIds: string[];

  category: string;
  vacancy: number;
  location: string;
  workplace: string;

  workingDays: number;
  weekends: string[];

  workingHours: {
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  };

  employmentType: string;

  salary: number;
  period: string;

  requiredDocuments: string[];

  status: string;

  keywords: string[];

  boardBackground: string;
  boardSortBy: string;
  boardSortOrder: string;

  deleteMarker: {
    status: boolean;
    deletedAt: string | null;
    dateScheduled: string | null;
  };

  tenantId: string | null;
  locationAdditionalInfo: string | null;

  attachmentsStorage: {
    Name: string;
    Bucket: string;
    Key: string;
  }[];
  attachments: {
    _id: string;
    collectionName: string;
    collectionDocument: string;
    storageInformation: StorageInformation;
    visibility: string;
    deleteMarker: DeleteMarker;
    createdAt: string;
    updatedAt: string;
    __v: number;
    src: string;
  }[];
  additionalQueries?: AdditionalQuery[];
  createdAt: string;
  updatedAt: string;
}

export type JobListResponse = {
  docs: JobData[];
  pagination: Pagination;
};

export type JobListBackendResponse = {
  success: boolean;
  jobs: JobData[];
  pagination: Pagination;
  message?: string;
};

export const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Full Time', value: EMPLOYMENT_TYPE.FULL_TIME },
  { label: 'Part Time', value: EMPLOYMENT_TYPE.PART_TIME },
  { label: 'Contract', value: EMPLOYMENT_TYPE.CONTRACT },
  { label: 'Freelance', value: EMPLOYMENT_TYPE.FREELANCE },
  { label: 'Intern', value: EMPLOYMENT_TYPE.INTERN },
];

export const WORKPLACE_OPTIONS = [
  { label: 'Remote', value: WORKPLACE_ENUMS.REMOTE },
  { label: 'Onsite', value: WORKPLACE_ENUMS.ONSITE },
  { label: 'Hybrid', value: WORKPLACE_ENUMS.HYBRID },
];

export const SALARY_MODE_OPTIONS = [
  { label: 'Negotiable', value: 'negotiable' },
  { label: 'Fixed', value: 'fixed' },
];

export const WORKING_DAYS_OPTIONS = [
  { label: 'Monday', value: WORKING_DAYS_ENUMS.MONDAY },
  { label: 'Tuesday', value: WORKING_DAYS_ENUMS.TUESDAY },
  { label: 'Wednesday', value: WORKING_DAYS_ENUMS.WEDNESDAY },
  { label: 'Thursday', value: WORKING_DAYS_ENUMS.THURSDAY },
  { label: 'Friday', value: WORKING_DAYS_ENUMS.FRIDAY },
  { label: 'Saturday', value: WORKING_DAYS_ENUMS.SATURDAY },
  { label: 'Sunday', value: WORKING_DAYS_ENUMS.SUNDAY },
];

export const PERIOD_OPTIONS = [
  { label: 'Hourly', value: PERIOD_ENUMS.HOURLY },
  { label: 'Daily', value: PERIOD_ENUMS.DAILY },
  { label: 'Weekly', value: PERIOD_ENUMS.WEEKLY },
  { label: 'Monthly', value: PERIOD_ENUMS.MONTHLY },
  { label: 'Yearly', value: PERIOD_ENUMS.YEARLY },
];

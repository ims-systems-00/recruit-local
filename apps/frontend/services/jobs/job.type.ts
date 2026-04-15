import { Pagination } from '@/types/api';
import { DeleteMarker } from '../file-media/file-media.type';
import { QUERY_TYPE_ENUMS } from '@rl/types';

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

import { Pagination } from '@/types/api';

export type JobListFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

export interface JobData {
  _id: string;
  title: string;
  description: string;
  email: string;
  number: string;
  aboutUs: string;

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
